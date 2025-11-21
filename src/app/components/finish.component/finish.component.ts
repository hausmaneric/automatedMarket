import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from "../loading/loading.component";

@Component({
  selector: 'app-finish',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers:[MainService],
  templateUrl: './finish.component.html',
  styleUrl: './finish.component.scss',
})
export class FinishComponent {
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
    this.cdr.detectChanges();
    this.closeDialog()
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
