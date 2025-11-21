import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MainService } from '../../services/main.service';

@Component({
  selector: 'app-main3',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  providers: [MainService],
  templateUrl: './main3.component.html',
  styleUrls: ['./main3.component.scss'],
})
export class Main3Component {
  name: string = '';
  img: string = '';
  showDialog = false;
  isDeleting = false;

  @Output() visibleChange = new EventEmitter<number>();

  constructor(private mainService: MainService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const company = this.mainService.getCompany();
    const trade = this.mainService.getTrade();
    const img = this.mainService.getImg();

    this.name = trade || company;
    if (img) this.img = img;
  }

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

  async deleteAccount() {
    if (this.isDeleting) return;
    this.isDeleting = true;
    this.cdr.detectChanges();
    try {
      const response: any = await this.mainService.customerAccessDelete(this.mainService.getFormValues());

      if (response.status) {

        this.updateVisible(1); // Volta para a tela inicial, por exemplo
      } else {
        alert(response?.message || 'Erro ao apagar a conta.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao apagar a conta.');
    } finally {
      this.isDeleting = false;
      this.showDialog = false;
      this.cdr.detectChanges();
    }
  }
}
