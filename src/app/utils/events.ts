import { IonInfiniteScroll, IonRefresher, IonSlides } from '@ionic/angular';

export interface IonInfiniteScrollEvent extends CustomEvent {
  readonly target: EventTarget & IonInfiniteScroll;
}

export interface IonRefresherEvent extends CustomEvent {
  readonly target: EventTarget & IonRefresher;
}

export interface IonSlidesEvent extends CustomEvent {
  readonly target: EventTarget & IonSlides;
}
