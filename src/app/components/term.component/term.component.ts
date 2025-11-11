import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from "../loading/loading.component";


@Component({
  selector: 'app-term',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers:[MainService],
  templateUrl: './term.component.html',
  styleUrl: './term.component.scss',
})
export class TermComponent {
  @ViewChild('codeInput') codeInputEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();

  form = new FormGroup({
    code: new FormControl('')
  });

  focused: Record<string, boolean> = {};
  dialogMessage = '';
  showDialog = false;
  isLoading = false;

  constructor(private renderer: Renderer2, private mainService: MainService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.form.get('code')!.value) this.focused['code'] = true;
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
    const form = this.mainService.getFormValues();
    this.isLoading = true;
    const response: any = await this.mainService.customerAccessActive(form);
    this.isLoading = false;
    this.cdr.detectChanges();
    if (response.status == true){
      this.showDialogMessage('Cadastro realizado com sucesso!');
      this.mainService.resetForm();
      this.cdr.detectChanges();
      setTimeout(() => {
        this.closeDialog();
        this.cdr.detectChanges();
      }, 1500);
      this.cdr.detectChanges();
    }else{
      this.showDialogMessage(response.message);
    }
  }

  showDialogMessage(msg: string) { this.dialogMessage = msg; this.showDialog = true; }
  closeDialog() {
    this.showDialog = false;
    this.updateVisible(1);
    this.cdr.detectChanges();
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
