import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Token is now loaded strictly from environment variables
const FIGMA_TOKEN = process.env.VITE_FIGMA_TOKEN || '';
const FILE_KEY = 'HIc2F0OeTuvafJNSTKMm3E';

if (!FIGMA_TOKEN || !FILE_KEY) {
    console.error('Missing VITE_FIGMA_TOKEN or VITE_FIGMA_FILE_KEY in .env');
    process.exit(1);
}

const headers = {
    'X-Figma-Token': FIGMA_TOKEN
};

const TARGET_DIR = path.resolve(__dirname, '../src/assets/goals');

// Transliteration map
const ruToLat = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', ' ': '_'
};

function transliterate(str) {
    return str.toLowerCase().split('').map(char => ruToLat[char] || char).join('').replace(/[^a-z0-9_]/g, '');
}

async function main() {
    try {
        console.log('Fetching Figma file...');
        const fileResp = await axios.get(`https://api.figma.com/v1/files/${FILE_KEY}`, { headers });
        const document = fileResp.data.document;

        // 1. Find the section "Наиболее популярные цели"
        let goalsSection = null;

        // Recursive search
        function findNode(node, predicate) {
            if (predicate(node)) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNode(child, predicate);
                    if (found) return found;
                }
            }
            return null;
        }

        const titleNode = findNode(document, n => n.type === 'TEXT' && n.name.includes('Наиболее популярные цели'));

        if (!titleNode) {
            console.error('Could not find text node "Наиболее популярные цели"');
            return;
        }

        console.log('Found title node:', titleNode.name, 'parent:', titleNode.parent?.name);

        // The parent likely contains the grid or is part of a frame that contains the grid
        // Look at siblings of the title node or its parent's siblings depending on structure
        // In Figma, usually: Frame -> [Title, GridContainer -> [Card, Card...]]

        // Let's find the container that holds the cards. It's likely a sibling of the title or close by.
        // Based on the user image, it's a grid below the title.

        // Attempt to find siblings of titleNode that are likely the grid
        // We need to look at the parent of the titleNode

        // We can't access parent directly from the found node in this recursion unless we pass it or search parent first.
        // Let's find the parent of the titleNode properly.

        let container = null;

        function findParent(node, targetId) {
            if (node.children) {
                for (const child of node.children) {
                    if (child.id === targetId) return node;
                    const found = findParent(child, targetId);
                    if (found) return found;
                }
            }
            return null;
        }

        const parent = findParent(document, titleNode.id);
        if (!parent) {
            console.error('Could not find parent of title node');
            return;
        }

        console.log('Parent node:', parent.name, parent.type);

        // Iterate over parent children to find goal cards.
        // A goal card usually contains some Text (Title) and an Image fill.

        const imageNodes = {}; // map of nodeId -> goalName

        function extractGoalsFromContainer(containerNode) {
            containerNode.children.forEach(child => {
                // Each child might be a card group or frame
                // We need to find the text for the name, and the node that has the image fill

                // Simplification: Look for a child that has text and an image fill inside it's subtree
                let name = null;
                let imageRef = null;
                let imageNodeId = null;

                function scanCard(n) {
                    if (n.type === 'TEXT' && !name) {
                        // Heuristic: first text is likely the title? Or maybe specific font size?
                        // Let's take the string content.
                        // The API returns 'characters' for content in some versions, but 'name' is the layer name.
                        // We need content. Note: 'characters' might not be populated in basic traversal if generic?
                        // Actually file JSON response usually has 'name' and sometimes 'characters' if it's a text node.
                        // But strictly speaking 'name' is layer name.
                        // Let's assume the layer name is descriptive or we can use it.
                        // Wait, 'characters' field is present in file JSON for TEXT nodes.
                        if (n.characters && n.characters.length > 2 && n.characters.length < 50) {
                            name = n.characters; // Capture the first text as potential name
                        }
                    }

                    if ((n.type === 'RECTANGLE' || n.type === 'FRAME' || n.type === 'INSTANCE' || n.type === 'COMPONENT') && n.fills) {
                        for (const fill of n.fills) {
                            if (fill.type === 'IMAGE' && fill.imageRef) {
                                imageRef = fill.imageRef;
                                imageNodeId = n.id;
                            }
                        }
                    }

                    if (n.children) {
                        n.children.forEach(scanCard);
                    }
                }

                scanCard(child);

                if (name && imageRef) {
                    console.log(`Found goal candidate: "${name}" (ImageID: ${imageNodeId})`);
                    imageNodes[imageNodeId] = name;
                }
            });
        }


        // Recursive scan of the parent to find ALL cards
        console.log('Scanning parent structure recursively for goals...');

        // We already have a helper scanCard in the previous version, let's make it robust
        // and apply it to the parent itself (or all children of parent)

        function recursiveFindGoals(node, depth = 0) {
            if (depth > 5) return; // Prevent infinite loops or too deep

            // Check if current node looks like a card
            // Card definition: Has a text child (Name) and an Image fill (Background)
            // OR: Is a group/frame containing these.

            let name = null;
            let imageRef = null;
            let imageNodeId = null;

            // Check current node's fills for image
            if ((node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') && node.fills) {
                for (const fill of node.fills) {
                    if (fill.type === 'IMAGE' && fill.imageRef) {
                        imageRef = fill.imageRef;
                        imageNodeId = node.id;
                    }
                }
            }

            // Use children to find name if we found an image on this node OR if this is a container
            if (node.children) {
                for (const child of node.children) {
                    if (child.type === 'TEXT' && !name) {
                        // Check content
                        if (child.characters && child.characters.length > 2 && child.characters.length < 50) {
                            name = child.characters;
                        }
                    }

                    // If the image wasn't on the container, maybe it's on a child?
                    // But usually the card background is the image.
                    // If the structure is Frame -> [ImageRect, Text], we need to handle that.
                    if (!imageRef && (child.type === 'RECTANGLE' || child.type === 'FRAME') && child.fills) {
                        for (const fill of child.fills) {
                            if (fill.type === 'IMAGE' && fill.imageRef) {
                                imageRef = fill.imageRef;
                                imageNodeId = child.id;
                            }
                        }
                    }
                }
            }

            // If we found both at this level (Container with image fill + Text child, OR Container with Image Child + Text Child)
            if (name && imageRef) {
                // Avoid adding duplicates or "generic" labels if possible
                if (!imageNodes[imageNodeId]) {
                    console.log(`Found goal: "${name}" (ID: ${imageNodeId})`);
                    imageNodes[imageNodeId] = name;
                }
            }

            // Recurse
            if (node.children) {
                node.children.forEach(child => recursiveFindGoals(child, depth + 1));
            }
        }



        // Spatial Matching Strategy
        const textNodes = [];
        const imageNodesList = [];

        // Helper to find image in a generic node
        function findImageDeep(node) {
            if (node.fills) {
                for (const fill of node.fills) {
                    if (fill.type === 'IMAGE' && fill.imageRef) return { ref: fill.imageRef, id: node.id };
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    const img = findImageDeep(child);
                    if (img) return img; // return first image found
                }
            }
            return null;
        }


        // Recursive collector
        function collectNodes(node) {
            if (node.type === 'TEXT') {
                if (node.characters && node.characters.length > 2 && node.characters.length < 100) {
                    if (node.absoluteBoundingBox) {
                        textNodes.push({
                            id: node.id,
                            text: node.characters,
                            box: node.absoluteBoundingBox
                        });
                    }
                }
            }

            // Check for image fills on this node
            if ((node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') && node.fills) {
                for (const fill of node.fills) {
                    if (fill.type === 'IMAGE' && fill.imageRef) {
                        if (node.absoluteBoundingBox) {
                            imageNodesList.push({
                                id: node.id,
                                imageId: node.id,
                                nodeToRender: node.id,
                                box: node.absoluteBoundingBox
                            });
                        }
                    }
                }
            }

            if (node.children) {
                node.children.forEach(child => collectNodes(child));
            }
        }

        collectNodes(parent);

        // Match Text and Image based on overlap
        // Text should be roughly inside or overlapping the Image/Card box

        function isOverlapping(box1, box2) {
            // Simple AABB check
            const noOverlap = box1.x + box1.width < box2.x ||
                box2.x + box2.width < box1.x ||
                box1.y + box1.height < box2.y ||
                box2.y + box2.height < box1.y;
            return !noOverlap;
        }

        function getCenter(box) {
            return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }

        function distance(p1, p2) {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }

        console.log(`Found ${textNodes.length} text candidates and ${imageNodesList.length} image candidates.`);

        textNodes.forEach(txt => {
            // Find closest image node
            let bestImg = null;
            let minDist = Infinity;

            const txtCenter = getCenter(txt.box);

            imageNodesList.forEach(img => {
                const imgCenter = getCenter(img.box);
                const dist = distance(txtCenter, imgCenter);

                // Heuristic: Must overlap or be very close
                // And closest one wins
                if (dist < minDist) {
                    minDist = dist;
                    bestImg = img;
                }
            });

            // Threshold for "association"
            // If center distance is less than half the diagonal of the image/card?
            if (bestImg) {
                // Check verify reasonable distance (e.g. within 200px)
                if (minDist < 300) { // arbitrary px value, but usually safe for cards
                    console.log(`Matched "${txt.text}" with Image (Dist: ${Math.round(minDist)})`);
                    // Use image ID for download map
                    imageNodes[bestImg.nodeToRender] = txt.text;
                }
            }
        });


        const nodeIds = Object.keys(imageNodes);
        if (nodeIds.length === 0) {

            console.log('No images found nearby. Trying to dump parent structure to debug.');
            // console.log(JSON.stringify(parent, null, 2));
            // Fallback: entire page scan for things that look like goal cards?
            // Let's trust the "nearby" logic for now. 
            // If "Наиболее популярные цели" is just a header, the cards are likely in the same parent frame.
        } else {
            console.log(`Found ${nodeIds.length} images to download.`);

            // 2. Get Image URLs
            const imagesResp = await axios.get(`https://api.figma.com/v1/images/${FILE_KEY}`, {
                params: { ids: nodeIds.join(','), format: 'png', scale: 2 },
                headers
            });

            const imageUrls = imagesResp.data.images;

            // 3. Download
            if (!fs.existsSync(TARGET_DIR)) {
                fs.mkdirSync(TARGET_DIR, { recursive: true });
            }

            for (const [id, url] of Object.entries(imageUrls)) {
                if (!url) {
                    console.warn(`No URL for image node ${id}`);
                    continue;
                }
                const rawName = imageNodes[id];
                // Clean up name: remove newlines, transliterate
                const cleanName = rawName.replace(/[\r\n]+/g, ' ').trim();
                const filename = transliterate(cleanName) + '.png';
                const filepath = path.join(TARGET_DIR, filename);

                console.log(`Downloading "${cleanName}" -> ${filename}...`);

                const writer = fs.createWriteStream(filepath);
                const response = await axios({
                    url,
                    method: 'GET',
                    responseType: 'stream'
                });

                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
            }
            console.log('Done!');
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

main();
