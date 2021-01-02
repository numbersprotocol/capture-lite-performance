import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SharedTestingModule } from '../../shared-testing.module';
import { NoDataComponent } from './no-data.component';

describe('NoDataComponent', () => {
  let component: NoDataComponent;
  let fixture: ComponentFixture<NoDataComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NoDataComponent],
        imports: [SharedTestingModule],
      }).compileComponents();

      fixture = TestBed.createComponent(NoDataComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
