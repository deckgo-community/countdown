import {Component, Method, Prop, h, Event, EventEmitter, Host, State, Watch} from '@stencil/core';

import {DeckdeckgoSlide} from '@deckdeckgo/slide-utils';

/**
 * @slot title - Display the remaining time until your presentation - h1,h2,h3,section
 */
@Component({
  tag: 'deckgo-slide-countdown',
  styleUrl: 'deckdeckgo-slide-countdown.scss',
  shadow: true
})
export class DeckdeckgoSlideCountdown implements DeckdeckgoSlide {
  @Event()
  slideDidLoad: EventEmitter<void>;

  /**
   * The amount of days before your presentations
   */
  @Prop({reflect: true})
  days = 0;

  /**
   *  The amount of hours before your presentations (max. 23)
   */
  @Prop({reflect: true})
  hours = 0;

  /**
   * The amount of minutes before your presentations (max. 59)
   */
  @Prop({reflect: true})
  minutes = 0;

  @Prop()
  seconds = 0;

  /**
   * A specific date and time until when your presentation will start (format: 2021-08-27T23:25:59.000+02:00)
   */
  @Prop({reflect: true})
  until: string;

  @State()
  private mDays = 0;

  @State()
  private mHours = 0;

  @State()
  private mMinutes = 0;

  @State()
  private mSeconds = 0;

  private mTotalSeconds = 0;
  private mCountdownInterval: NodeJS.Timeout | undefined = undefined;

  async componentDidLoad() {
    await this.init();

    this.slideDidLoad.emit();
  }

  async disconnectedCallback() {
    await this.clearUp();
  }

  private async init() {
    await this.clearUp();

    await this.initTimer();
    await this.startCountdown();
  }

  @Watch('until')
  @Watch('days')
  @Watch('hours')
  @Watch('minutes')
  @Watch('seconds')
  async onPropChanges() {
    await this.init();
  }

  @Method()
  beforeSwipe(_enter: boolean, _reveal: boolean): Promise<boolean> {
    return Promise.resolve(true);
  }

  @Method()
  afterSwipe(): Promise<void> {
    return this.clearUp();
  }

  @Method()
  lazyLoadContent(): Promise<void> {
    return Promise.resolve();
  }

  @Method()
  revealContent(): Promise<void> {
    return Promise.resolve();
  }

  @Method()
  hideContent(): Promise<void> {
    return Promise.resolve();
  }

  @Method()
  async start() {
    await this.startCountdown();
  }

  @Method()
  async stop() {
    await this.clearUp();
  }

  /**
   * @internal
   */
  private async clearUp() {
    if (this.mCountdownInterval) {
      clearInterval(this.mCountdownInterval);

      this.mCountdownInterval = undefined;
    }
  }

  /**
   * @internal
   */
  private async initTimer(): Promise<void> {
    if (this.until && this.until !== undefined && this.until !== '') {
      const startAt: Date = new Date(this.until);
      const now: Date = new Date();

      if (startAt && startAt.getTime() > now.getTime()) {
        let diff: number = (startAt.getTime() - now.getTime()) / (60 * 60 * 1000);

        if (diff >= 24) {
          const diffHours: number = diff / 24;

          this.mDays = diffHours >= 99 ? 99 : Math.floor(diffHours);
          this.mHours = Math.floor((diffHours % 1) * 24);
        } else {
          this.mDays = 0;
          this.mHours = Math.floor(diff);
        }

        diff = (diff % 1) * 60;

        this.mMinutes = Math.floor(diff);

        diff = (diff % 1) * 60;

        this.mSeconds = Math.floor(diff);

        this.mTotalSeconds = this.mDays * 24 * 60 * 60 + this.mHours * 60 * 60 + this.mMinutes * 60 + this.mSeconds;

        return;
      }
    }

    this.mDays = this.days;
    this.mHours = this.hours;
    this.mMinutes = this.minutes;
    this.mSeconds = this.seconds;

    this.mTotalSeconds = this.mDays * 24 * 60 * 60 + this.mHours * 60 * 60 + this.mMinutes * 60 + this.mSeconds;
  }

  /**
   * @internal
   */
  private async startCountdown() {
    this.mCountdownInterval = setInterval(() => {
      if (this.mTotalSeconds > 0) {
        --this.mSeconds;

        if (this.mMinutes >= 0 && this.mSeconds < 0) {
          this.mSeconds = 59;
          --this.mMinutes;
        }

        if (this.mHours >= 0 && this.mMinutes < 0) {
          this.mMinutes = 59;
          --this.mHours;
        }

        --this.mTotalSeconds;
      } else {
        clearInterval(this.mCountdownInterval);
        this.mCountdownInterval = undefined;
      }
    }, 1000);
  }

  render() {
    return (
      <Host class={{'deckgo-slide-container': true}}>
        <div class="deckgo-slide">
          <slot name="title"></slot>
          {this.renderCountdown()}
          <slot name="notes"></slot>
          <slot name="actions"></slot>
          <slot name="background"></slot>
          <slot name="header"></slot>
          <slot name="footer"></slot>
        </div>
      </Host>
    );
  }

  private renderCountdown() {
    if (this.mDays >= 1) {
      return (
        <div class="deckgo-countdown-container">
          {this.renderCountdownTime('days', this.mDays)}
          {this.renderCountdownTime('hours', this.mHours)}
          {this.renderCountdownTime('minutes', this.mMinutes)}
        </div>
      );
    } else {
      return (
        <div class="deckgo-countdown-container">
          {this.renderCountdownTime('hours', this.mHours)}
          {this.renderCountdownTime('minutes', this.mMinutes)}
          {this.renderCountdownTime('seconds', this.mSeconds)}
        </div>
      );
    }
  }

  private renderCountdownTime(slotName: string, value: number) {
    return (
      <div class="time-container">
        <slot name={slotName}></slot>

        <div class="figure-container">
          <div class="figure tens">
            <span>{`${value >= 10 ? Math.floor(value / 10) % 10 : 0}`}</span>
          </div>

          <div class="figure unit">
            <span>{`${value % 10}`}</span>
          </div>
        </div>
      </div>
    );
  }
}
