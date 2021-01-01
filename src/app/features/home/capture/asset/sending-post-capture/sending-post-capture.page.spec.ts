import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DiaBackendContactTestingRepository } from '../../../../../shared/services/dia-backend/contact/dia-backend-contact-repository-testing.service';
import { DiaBackendContactRepository } from '../../../../../shared/services/dia-backend/contact/dia-backend-contact-repository.service';
import { SharedTestingModule } from '../../../../../shared/shared-testing.module';
import { SendingPostCapturePage } from './sending-post-capture.page';

describe('SendingPostCapturePage', () => {
  let component: SendingPostCapturePage;
  let fixture: ComponentFixture<SendingPostCapturePage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SendingPostCapturePage],
        imports: [SharedTestingModule],
        providers: [
          {
            provide: DiaBackendContactRepository,
            useClass: DiaBackendContactTestingRepository,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SendingPostCapturePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
