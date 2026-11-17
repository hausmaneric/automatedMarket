import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { version } from '../../resources';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MatIconModule],
  providers: [MainService],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  name: string = '';
  img: string = '';
  _version = '';

  @Output() visibleChange = new EventEmitter<number>();
  constructor(private mainService: MainService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._version = version;
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
