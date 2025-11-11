import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-confirmation',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  @ViewChild('codeInput') codeInputEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();

  form = new FormGroup({
    code: new FormControl('')
  });

  focused: Record<string, boolean> = {};
  dialogMessage = '';
  showDialog = false;
  isLoading = false;

  email = ''; // Pode receber via Input ou service

  constructor(private renderer: Renderer2, private mainService: MainService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.form.get('code')!.value) this.focused['code'] = true;
    this.email = this.mainService.getFormValue('email');
  }

  onFocus(name: string) { this.focused[name] = true; }
  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  onCodeInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.form.get('code')!.setValue(input.value);
    this.focused['code'] = !!input.value;
  }

  async validateCode() {
    const code = this.form.get('code')!.value;
    this.mainService.setFormValue('codeAccess', this.form.get('code')!.value);
    if (!code) {
      this.showDialogMessage('Por favor, insira o código de validação.');
    } else {
      this.isLoading = true;
      const response: any = await this.mainService.customerAccessValidity(this.mainService.getFormValues());
      this.isLoading = false;
      this.cdr.detectChanges();
      if (response.status){
        this.updateVisible(5)
      }else{
        this.showDialogMessage(response.message);
      }
    }
  }

  showDialogMessage(msg: string) { this.dialogMessage = msg; this.showDialog = true; }
  closeDialog() {
    this.showDialog = false;
    this.cdr.detectChanges();
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
