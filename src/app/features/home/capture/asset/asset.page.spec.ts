import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SharedTestingModule } from '../../../../shared/shared-testing.module';
import { AssetPage } from './asset.page';

describe('AssetPage', () => {
  let component: AssetPage;
  let fixture: ComponentFixture<AssetPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AssetPage],
        imports: [SharedTestingModule],
      }).compileComponents();

      fixture = TestBed.createComponent(AssetPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
