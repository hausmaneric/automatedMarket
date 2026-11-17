import { ChangeDetectorRef, Component, EventEmitter, NgZone, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-main3',
  standalone: true,
  imports: [CommonModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './main3.component.html',
  styleUrls: ['./main3.component.scss'],
})
export class Main3Component {
  name: string = '';
  img: string = '';
  showDialog = false;

  isLoading = false;

  // Dialog de mensagem
  showMessageDialog = false;
  dialogMessage = '';

  @Output() visibleChange = new EventEmitter<number>();

  constructor(private mainService: MainService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    const company = this.mainService.getCompany();
    const trade = this.mainService.getTrade();
    const img = this.mainService.getImg();

    this.name = trade || company;
    if (img) this.img = img;
      history.pushState(null, '', location.href);

    // 🔹 Captura o botão voltar (mobile + desktop)
    window.addEventListener('popstate', this.onBrowserBack);
  }

  onBrowserBack = () => {
    this.ngZone.run(() => {
      this.updateVisible(1); // 🔥 faz exatamente o mesmo que o botão back
    });
  };

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
    this.cdr.detectChanges();
  }

  confirmDelete() {
    this.showDialog = true;
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.showDialog = false;
    this.cdr.detectChanges();
  }

  showDialogMessage(msg: string) {
    this.dialogMessage = msg;
    this.showMessageDialog = true;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  closeMessageDialog() {
    this.showMessageDialog = false;
    this.cdr.detectChanges();
  }

  async deleteAccount() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const response: any = await this.mainService.customerAccessDelete(this.mainService.getFormValues());
      console.log(response)
      if (response.status) {
        this.showDialog = false;
        this.updateVisible(15);
      } else {
        this.showDialog = false;
        this.showDialogMessage(response?.message || 'Erro ao apagar a conta.');
      }
    } catch (err) {
      console.error(err);
      this.showDialog = false;
      this.showDialogMessage('Erro inesperado ao apagar a conta.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
