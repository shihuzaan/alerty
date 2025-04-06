import $ from "jquery";
import * as string_decoder from "node:string_decoder";

interface AnimationStep {
    element: JQuery;
    cssProperties: { [key: string]: string | number };
    startTime: number;
}

interface AnimationQueue {
    id: string;
    animationSequence: Array<AnimationSequence>;
    animationState: AnimationStates;
}

interface AutoDismissDuration {
    name: string;
    duration: number;
}

enum Positions {
    TOP = "top",
    BOTTOM = "bottom",
    LEFT = "left",
    RIGHT = "right"
}

interface Icon {
    cssClass: string;
    html: string;
    position: Positions;
}

interface AlertConfiguration {
    message?: string;
    type?: string;
    duration?: string;
    showDismissButton?: boolean;
    icon?: Icon;
}

enum AutoDismissDurationTypes {
    SHORT = 3000,
    MEDIUM = 6000,
    LONG = 8000,
    EXTRA_LONG = 10000
}

enum AnimationStates {
    START = "start",
    END = "end",
    PAUSE = "pause",
    PLAY = "play"
}

interface AnimationSequence {
    step: AnimationStep;
    animateWith?: Array<Array<AnimationStep>>;
    pauseAnimationOnEnd?: boolean;
    playAnimationOnStart?: boolean;
}

class App {
    private _alertContainer: JQuery = $();
    private _alertBoxCssDuration: number = 400;
    
    private _defaultAlertConfiguration: AlertConfiguration = {
        message: "This is an alert.",
        type: "info",
        duration: "short",
        showDismissButton: true,
        icon: {
            html: "",
            position: Positions.LEFT,
            cssClass: ""
        } as Icon,
    };

    private _autoDismissDuration: AutoDismissDuration[] = [
        {name: "short", duration: AutoDismissDurationTypes.SHORT},
        {name: "medium", duration: AutoDismissDurationTypes.MEDIUM},
        {name: "long", duration: AutoDismissDurationTypes.LONG},
        {name: "extra-long", duration: AutoDismissDurationTypes.EXTRA_LONG}
    ];

    private _alertQueue : Array<AnimationQueue> = [];
    
    private _alertContent: AlertConfiguration[] = [
        {
            message: "Item copied to clipboard", 
            icon: { html: "<i class='bi bi-clipboard-check'></i>",position: Positions.LEFT} as Icon, 
            duration: "short",
            showDismissButton: true 
        },
        {
            message: "Request sent", 
            icon: { html: "<i class='bi bi-send-check'></i>", position: Positions.LEFT} as Icon,
            duration: "medium"},
        {
            message: "Refund processed", 
            icon: {html: "<i class='bi bi-cash-coin'></i>", position: Positions.TOP} as Icon, 
            duration: "short"},
        {
            message: "Successfully saved" 
        },
        {
            message: "Item added to cart", 
            duration: "short"
        },
    ];

    constructor() {
        //check if jquery is loaded
        if (typeof $ === "undefined") {
            console.error("jQuery is not loaded!");
            return;
        }

        this.init();
    }

    private init(): void {
        $(this.createAlertContainerHtml()).appendTo('body');
        this._alertContainer = $("#alert-container");
        const button = $("#myButton");
        if (button.length) {
            button.on("click", () => this.showAlert());
        } else {
            console.error("Button not found!");
        }
    }

    private showAlert(): void {
        if (this._alertContainer.length) {
            const randomContentIndex = Math.floor(Math.random() * this._alertContent.length);
            const selectedContent = this._alertContent[randomContentIndex];
            const alertHtml = this.createAlertHtml(selectedContent);
            this.animateAlert(alertHtml, selectedContent);
        } else {
            console.error("Alert container not found!");
        }
    }

    private createAlertContainerHtml(): string {
        return `<div
            class="position-fixed vw-100"
            style="z-index: 1000; bottom: 30px; pointer-events: none;"
            >
                <div id="alert-container" class="d-flex flex-column"
                style="transition: all 0.5s ease-out; transform: translateY(0);">
                    <!-- Alert will be injected here -->
                </div>
            </div>`;
    }

    private createAlertHtml(content: AlertConfiguration): string {
        const isDismissible = content.showDismissButton || !content.duration || this._defaultAlertConfiguration.showDismissButton!;
        const dismissButtonHtml = isDismissible ? `<button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>` : '';
        const message = content.message || this._defaultAlertConfiguration.message!;
        const iconHtml = content.icon?.html || this._defaultAlertConfiguration.icon?.html!;
        
        const hasTopIcon = content.icon?.position === Positions.TOP;
        const hasLeftIcon = content.icon?.position === Positions.LEFT;
        
        const topIconHtml = iconHtml && hasTopIcon ? `<div class="top-icon mb-1 text-center" style="font-size: 1.2em;">${iconHtml}</div>` : '';
        const leftIconHtml = iconHtml && hasLeftIcon ? `<div class="me-2" style="font-size: 1.2em;">${iconHtml}</div>` : '';

        return `
            <div class="d-flex flex-column" style="pointer-events: auto;">
            ${topIconHtml}
                <div class="d-flex align-items-center">
                    ${leftIconHtml}
                    <div>${message}</div>
                    ${dismissButtonHtml}
                </div>
            </div>
            `;
    }

    private animateAlert(alertHtml: string, alertConfig: AlertConfiguration): void {
        const duration = alertConfig.duration;
        const showDismissButton = alertConfig.showDismissButton;
        const type = alertConfig.type || this._defaultAlertConfiguration.type;

        const alertWrapper = $("<div class='d-flex justify-content-center overflow-visible'></div>");
        const alertBox = $(`<div class="d-flex alert-${type} alert align-items-center justify-content-center shadow-lg shadow-sm fs-6 rounded-4 overflow-visible" 
        style="padding: 10px 15px; margin-top: 10px; min-width: 150px; min-height: 40px; font-size: 10px !important;"></div>`);
        alertBox.append(alertHtml);

        const clonedAlertBox = alertBox.clone()
            .css({
                position: 'fixed',
                visibility: 'hidden'
            })
            .appendTo('body')

        const height = clonedAlertBox.height()! + parseInt(alertBox.outerHeight(true)?.toString() || "0");
        clonedAlertBox.remove();

        const alertDuration = this._autoDismissDuration.find(item => item.name === duration)?.duration || AutoDismissDurationTypes.SHORT;

        alertBox.css({
            zIndex: 999,
            opacity: 0,
            transform: "scale(0.5) translateY(70px)",
            transition: `all ${this._alertBoxCssDuration}ms ease-out`,
            position: "absolute"
        });

        alertWrapper.css({
            zIndex: 999,
            height: `${height}px`,
            transition: `all ${this._alertBoxCssDuration}ms ease-out`,
            position: "relative",
        });

        alertWrapper.prepend(alertBox);

        this._alertContainer.prepend(alertWrapper);

        const alertWrapperId = `alert-wrapper-${this.createUid()}`;
        alertWrapper.attr("id", alertWrapperId);

        const alertDismissButtonId = `alert-dismiss-button-${this.createUid()}`;
        alertBox.find('[data-bs-dismiss="alert"]').attr("id", alertDismissButtonId);

        const wrapperSequence : Array<AnimationSequence> = [
            {
                step: {
                    element: alertBox,
                    cssProperties: {zIndex: 1000, opacity: 0.8, transform: "scale(1.2) translateY(-30px)"},
                    startTime: 400
                }
            },
            {
                step: {
                    element: alertBox,
                    cssProperties: {opacity: 1, transform: "scale(1) translateY(0)"},
                    startTime: 290
                },
                animateWith: [
                    [
                        {
                            element: this._alertContainer,
                            cssProperties: {transform: "translateY(20px)"},
                            startTime: 100
                        },
                        {
                            element: this._alertContainer,
                            cssProperties: {transform: "translateY(0)"},
                            startTime: 250
                        }
                    ]
                ],
                pauseAnimationOnEnd: !duration || showDismissButton,
            },
            {
                step: {
                    element: alertBox,
                    cssProperties: {zIndex: 999, transform: "scale(0.9) translateY(20px)"},
                    startTime: alertDuration
                },
                animateWith: [
                    [
                        {
                            element: alertBox,
                            cssProperties: {opacity: 0, transform: "scale(0.7) translateY(-20px)"},
                            startTime: 250
                        }
                    ],
                    [
                        {
                            element: alertWrapper,
                            cssProperties: {padding: "0", height: "0"},
                            startTime: 20
                        }
                    ]
                ],
                playAnimationOnStart: !duration || showDismissButton,
            }
        ];

        const animationQueue: AnimationQueue = {
            id: alertWrapperId,
            animationSequence: wrapperSequence,
            animationState: AnimationStates.START
        }

        this.addToQueue(animationQueue);

        const alertDismissButton = $("#" + alertDismissButtonId);
        if (alertDismissButton.length) {
            alertDismissButton.on("click", () => {
                const animationQueue = this.getQueueItemById(alertWrapperId);
                if(animationQueue)
                {
                    this.animateSequence(animationQueue, 0);
                }
            });
        }

        this.animateSequence(animationQueue, 0, (animationState) => {
            switch (animationState) {
                case AnimationStates.END:
                    const alertWrapper = $("#" + alertWrapperId);
                    if (alertWrapper) {
                        alertWrapper.remove();
                    }
                    break;
                case AnimationStates.PLAY:
                    break;
            }
        });
    }

    private createUid(): string {
        return Math.random().toString(36).substr(2, 9);
    }
    
    private animateSequence(this: App, queue: AnimationQueue, time: number = 0, onStateChanged?: (animationState: AnimationStates) => void): void {
        const {id, animationSequence, animationState} = queue;
        let currentStep = 0;
        const totalSteps = animationSequence.length;
        let currentTime = time;
        let isPaused = false;

        const executeStep = (): void => {
            if (currentStep >= totalSteps) {
                return;
            }

            const {step, animateWith, pauseAnimationOnEnd, playAnimationOnStart} = animationSequence[currentStep];
            currentStep++;

            currentTime += step.startTime;

            if(playAnimationOnStart && animationState === AnimationStates.PAUSE) {
                if (onStateChanged) {
                    onStateChanged(AnimationStates.PLAY);
                }
                currentTime = 0;
            } else if (playAnimationOnStart){
                console.log("Use pauseAnimationOnEnd on animation step before playAnimationOnStart");
            }

            const timer = setTimeout(() => {
                step.element.css(step.cssProperties);
                clearTimeout(timer);
            }, currentTime);

            if (animateWith?.length) {
                animateWith.forEach((subSteps) => {
                    const animationSteps = subSteps.map(subStep => ({step: subStep}));
                    const subAnimationQueue: AnimationQueue = {
                        id: id,
                        animationSequence: animationSteps,
                        animationState: AnimationStates.START
                    }
                    this.animateSequence(subAnimationQueue, currentTime);
                });
            }
            if (pauseAnimationOnEnd && (animationState === AnimationStates.START || animationState === AnimationStates.PLAY)) {
                setTimeout(() => {
                    this.updateQueueState(id, AnimationStates.PAUSE);
                    this.removeAnimationSequenceStep(id, currentStep);
                    if (onStateChanged) {
                        onStateChanged(AnimationStates.PAUSE);
                    }
                }, currentTime);
                isPaused = true;
                return;
            }

            executeStep();
        }

        executeStep();

        if (onStateChanged && !isPaused) {
            const totalStepsTime = animationSequence.reduce((acc, step) => acc + step.step.startTime, 0);
            const maxAnimationWithTime = Math.max(...animationSequence.map(step => step.animateWith?.reduce((acc, subSteps) => {
                return acc + subSteps.reduce((subAcc, subStep) => subAcc + subStep.startTime, 0);
            }, 0) || 0));
            const animationTime = totalStepsTime + maxAnimationWithTime + this._alertBoxCssDuration;

            setTimeout(() => {
                this.removeFromQueue(id);
                onStateChanged(AnimationStates.END);
            }, animationTime);
        }
    }

    private getRandomType(): string {
        const types = ["success", "info", "warning", "danger"];
        return types[Math.floor(Math.random() * types.length)];
    }

    private addToQueue(animationQueue: AnimationQueue): void {
        this._alertQueue.push(animationQueue);
    }

    private removeFromQueue(id: string): void {
        this._alertQueue = this._alertQueue.filter(item => item.id !== id);
    }

    //update Queue state by Id
    private updateQueueState(id: string, animationState: AnimationStates): void {
        const item = this.getQueueItemById(id);
        if (item) {
            item.animationState = animationState;
        }
    }

    private clearQueue(): void {
        this._alertQueue = [];
    }

    private getQueue(): Array<AnimationQueue> {
        return this._alertQueue;
    }

    private getQueueLength(): number {
        return this._alertQueue.length;
    }

    private getQueueItemByIndex(index: number): AnimationQueue | undefined {
        return this._alertQueue[index];
    }

    private getQueueItemById(id: string): AnimationQueue | undefined {
        return this._alertQueue.find(item => item.id === id);
    }

    private removeAnimationSequenceStep(id: string, stepIndex: number): void {
        const item = this.getQueueItemById(id);
        if (item) {
            item.animationSequence.splice(0, stepIndex);
        }
    }
}

$(function () {
    const app = new App();
});
