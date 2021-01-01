import { TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../shared.module';
import { DiaBackendContactRepository } from './dia-backend-contact-repository.service';

xdescribe('DiaBackendContactRepository', () => {
  let repository: DiaBackendContactRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SharedModule] });
    repository = TestBed.inject(DiaBackendContactRepository);
  });

  it('should be created', () => expect(repository).toBeTruthy());
});
