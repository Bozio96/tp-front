import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliersListComponent } from './suppliers-list.component';

describe('SuppliersListComponent', () => {
  let component: SuppliersListComponent;
  let fixture: ComponentFixture<SuppliersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
