import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataToolbarComponent } from './data-toolbar.component';

describe('DataToolbarComponent', () => {
  let component: DataToolbarComponent;
  let fixture: ComponentFixture<DataToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
