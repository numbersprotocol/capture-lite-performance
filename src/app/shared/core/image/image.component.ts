import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-img',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ImageComponent {
  @Input() src!: string;

  private readonly _isLoading$ = new BehaviorSubject(false);
  readonly isLoading$ = this._isLoading$.asObservable();

  imageWillLoad() {
    this._isLoading$.next(true);
  }

  imageDidLoad() {
    this._isLoading$.next(false);
  }
}
