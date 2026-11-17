import { ChangeDetectorRef, Component, EventEmitter, NgZone, Output } from '@angular/core';
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
  constructor(private mainService: MainService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

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
    history.pushState(null, '', location.href);

    // 🔹 Captura o botão voltar (mobile + desktop)
    window.addEventListener('popstate', this.onBrowserBack);
  }

  onBrowserBack = () => {
    this.ngZone.run(() => {
      this.updateVisible(1); // 🔥 faz exatamente o mesmo que o botão back
    });
  };

  ngAfterViewInit(): void {

  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
    this.cdr.detectChanges();
  }
}
