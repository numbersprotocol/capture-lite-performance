import { TestBed } from '@angular/core/testing';
import { SharedTestingModule } from '../../shared-testing.module';
import { PagingSourceManager } from './paging-source-manager.service';

describe('PagingSourceManager', () => {
  let manager: PagingSourceManager;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SharedTestingModule] });
    manager = TestBed.inject(PagingSourceManager);
  });

  it('should be created', () => {
    expect(manager).toBeTruthy();
  });
});
