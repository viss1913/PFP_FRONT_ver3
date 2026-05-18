const MOBILE_REPORT_BASE_STYLES = `<style>
html,body{margin:0;padding:0;max-width:100%;overflow-x:auto;-webkit-text-size-adjust:100%}
*,*::before,*::after{box-sizing:border-box}
img,table,svg,canvas,video{max-width:100%!important;height:auto!important}
table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}
h1,h2,h3,h4,p,div,section,article{max-width:100%;overflow-wrap:break-word;word-wrap:break-word}
</style>`;

/** Обёртка HTML от бэка для превью в iframe на узких экранах (без правок API). */
export function wrapReportHtmlForMobile(html: string): string {
    if (!html?.trim()) return html;
    if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head[^>]*>/i, (m) => m + MOBILE_REPORT_BASE_STYLES);
    }
    return MOBILE_REPORT_BASE_STYLES + html;
}
