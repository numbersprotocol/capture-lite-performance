import {
  IonInfiniteScroll,
  IonRefresher,
  IonSlides,
  IonToggle,
} from '@ionic/angular';

export interface IonInfiniteScrollEvent extends CustomEvent {
  readonly target: EventTarget & IonInfiniteScroll;
}

export interface IonRefresherEvent extends CustomEvent {
  readonly target: EventTarget & IonRefresher;
}

export interface IonSlidesEvent extends CustomEvent {
  readonly target: EventTarget & IonSlides;
}

export interface IonToggleEvent extends CustomEvent {
  readonly target: EventTarget & IonToggle;
}
