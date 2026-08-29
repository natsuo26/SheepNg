import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepListComponent } from './sheep-list.component';

describe('SheepListComponent', () => {
  let component: SheepListComponent;
  let fixture: ComponentFixture<SheepListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheepListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
