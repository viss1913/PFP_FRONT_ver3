import React from 'react';

import { ArrowRight, Star, X } from 'lucide-react';

import type { ClientGoal } from '../../types/client';

import type { GoalGalleryItem } from '../../utils/GoalImages';

import {

    B2C_GOAL_HERO_INHERITANCE,

    B2C_GOAL_HERO_PASSIVE,

    B2C_GOAL_HERO_PENSION,

    getB2cGuestGoalCardDescription,

} from '../../content/b2cGoalSelectionCopy';

import { getGoalImage, GOAL_TYPE_INHERITANCE, GOAL_TYPE_INVESTMENT } from '../../utils/GoalImages';



interface B2cStepGoalSelectionProps {

    goals: ClientGoal[];

    featuredItem: GoalGalleryItem | null;

    featuredKind: 'passive' | 'pension' | 'inheritance';

    gridItems: GoalGalleryItem[];

    onFeaturedClick: () => void;

    onGridItemClick: (item: GoalGalleryItem) => void;

    onRemoveGoal: (index: number) => void;

    onPrev: () => void;

    onNext: () => void;

    formatCurrency: (val: number) => string;

}



const heroCopyByKind = {

    passive: B2C_GOAL_HERO_PASSIVE,

    pension: B2C_GOAL_HERO_PENSION,

    inheritance: B2C_GOAL_HERO_INHERITANCE,

} as const;



const B2cStepGoalSelection: React.FC<B2cStepGoalSelectionProps> = ({

    goals,

    featuredItem,

    featuredKind,

    gridItems,

    onFeaturedClick,

    onGridItemClick,

    onRemoveGoal,

    onPrev,

    onNext,

    formatCurrency,

}) => {

    const hero = heroCopyByKind[featuredKind];



    return (

        <div className="b2c-step-goals b2c-step-goals--premium">

            <div className="b2c-step-goals__scroll">

                <header className="b2c-step-goals__header">

                    <h2 className="b2c-step-goals__title">Выберите вашу первую цель</h2>

                    <p className="b2c-step-goals__subtitle">

                        Мы начнём с самой важной цели, а затем добавим другие.

                    </p>

                </header>



                {goals.length > 0 ? (

                    <div className="b2c-step-goals__selected">

                        <h3 className="b2c-step-goals__selected-title">Выбранные цели ({goals.length})</h3>

                        <div className="b2c-step-goals__selected-list">

                            {goals.map((g, idx) => (

                                <div key={`${g.name}-${idx}`} className="b2c-step-goals__selected-chip">

                                    <img

                                        src={getGoalImage(g.name, g.goal_type_id, g.gallery_source_id)}

                                        alt=""

                                        className="b2c-step-goals__selected-chip-image"

                                    />

                                    <div className="b2c-step-goals__selected-chip-text">

                                        <span className="b2c-step-goals__selected-chip-name">{g.name}</span>

                                        <span className="b2c-step-goals__selected-chip-sum">

                                            {formatCurrency(

                                                g.goal_type_id === 1 || g.goal_type_id === 2

                                                    ? g.desired_monthly_income || 0

                                                    : g.goal_type_id === GOAL_TYPE_INVESTMENT ||

                                                        g.goal_type_id === 8 ||

                                                        g.goal_type_id === GOAL_TYPE_INHERITANCE ||

                                                        g.goal_type_id === 7

                                                      ? g.initial_capital || 0

                                                      : g.target_amount || 0,

                                            )}

                                        </span>

                                    </div>

                                    <button

                                        type="button"

                                        className="b2c-step-goals__selected-chip-remove"

                                        onClick={() => onRemoveGoal(idx)}

                                        aria-label={`Удалить цель ${g.name}`}

                                    >

                                        <X size={14} />

                                    </button>

                                </div>

                            ))}

                        </div>

                    </div>

                ) : null}



                {featuredItem ? (
                    <article className="b2c-step-goals__hero">
                        <div className="b2c-step-goals__hero-media">
                            <img src={featuredItem.image} alt="" className="b2c-step-goals__hero-image" />
                        </div>
                        <div className="b2c-step-goals__hero-body">
                            <p className="b2c-step-goals__hero-badge">
                                <Star size={14} aria-hidden />
                                {hero.badge}
                            </p>
                            <h3 className="b2c-step-goals__hero-title">{hero.title}</h3>
                            <p className="b2c-step-goals__hero-desc">{hero.description}</p>
                            <button type="button" className="b2c-step-goals__hero-cta" onClick={onFeaturedClick}>
                                {hero.cta}
                            </button>
                        </div>
                    </article>
                ) : null}



                {gridItems.length > 0 ? (

                    <div className="b2c-step-goals__grid">

                        {gridItems.map((item) => {

                            const cardDescription = getB2cGuestGoalCardDescription(item);

                            return (

                                <button

                                    key={item.id}

                                    type="button"

                                    className="b2c-step-goals__card"

                                    onClick={() => onGridItemClick(item)}

                                >

                                    <div className="b2c-step-goals__card-image-wrap">

                                        <img src={item.image} alt="" className="b2c-step-goals__card-image" />

                                    </div>

                                    <div className="b2c-step-goals__card-text">

                                        <span className="b2c-step-goals__card-title">{item.title}</span>

                                        {cardDescription ? (

                                            <span className="b2c-step-goals__card-desc">{cardDescription}</span>

                                        ) : null}

                                    </div>

                                </button>

                            );

                        })}

                    </div>

                ) : null}

            </div>



            <div className="b2c-step-goals__actions">

                <button type="button" className="b2c-step-goals__back" onClick={onPrev}>

                    Назад

                </button>

                <button

                    type="button"

                    className="b2c-step-goals__next"

                    onClick={onNext}

                    disabled={goals.length === 0}

                >

                    Далее

                    <ArrowRight size={18} strokeWidth={2.25} aria-hidden />

                </button>

            </div>

        </div>

    );

};



export default B2cStepGoalSelection;


