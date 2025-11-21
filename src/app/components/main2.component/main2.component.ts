import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';

@Component({
  selector: 'app-main2',
  standalone: true,
  imports: [MatIconModule],
  providers: [MainService],
  templateUrl: './main2.component.html',
  styleUrl: './main2.component.scss',
})
export class Main2Component {
  name: string = '';
  img: string = '';

  @Output() visibleChange = new EventEmitter<number>();
  constructor(private mainService: MainService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const company = this.mainService.getCompany();
    const trade   = this.mainService.getTrade();
    const img     = this.mainService.getImg();
    if (trade != ''){
      this.name = trade
    }else{
      this.name = company
    }

    if(img != ''){
      this.img = img;
    }
  }

  ngAfterViewInit(): void {

  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
    this.cdr.detectChanges();
  }
}
