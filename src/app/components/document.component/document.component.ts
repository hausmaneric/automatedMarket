import { Component, ElementRef, ViewChild, ChangeDetectorRef, NgZone, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { ApiService } from '../../services/api.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService, ApiService],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
})
export class DocumentComponent {
  @ViewChild('cpfInput') cpfInputEl!: ElementRef;
  @ViewChild('dateWrapper') dateWrapperEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();
  @Output() cpfValidated = new EventEmitter<{ nome: string; nascimento: string }>();

  form = new FormGroup({
    cpf: new FormControl(''),
    birth_date: new FormControl(''),
  });

  focused: Record<string, boolean> = {};
  calendarOpen = false;
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  weeks: Array<Array<{ d: Date | null; currentMonth: boolean }>> = [];
  private touchStartX = 0;
  private touchEndX = 0;
  monthsPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  weekdaysPt = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  dateDisplay = '';
  dialogMessage = '';
  showDialog = false;
  isLoading = false;
  shouldRefocus = false; // 🔹 Nova flag de controle

  constructor(
    private mainService: MainService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.form.get('cpf')!.value) this.focused['cpf'] = true;

    history.pushState(null, '', location.href);

    // 🔹 Captura o botão voltar (mobile + desktop)
    window.addEventListener('popstate', this.onBrowserBack);
  }

  onBrowserBack = () => {
    this.ngZone.run(() => {
      this.updateVisible(1); // 🔥 faz exatamente o mesmo que o botão back
    });
  };

  onFocus(name: string) {
    this.focused[name] = true;
  }

  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  formatDisplayDate(value: string | null): string {
    if (!value) return '';
    let day: string, month: string, year: string;

    if (value.includes('-')) {
      const parts = value.split('-').map(n => parseInt(n, 10));
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      day = String(d.getDate()).padStart(2, '0');
      month = String(d.getMonth() + 1).padStart(2, '0');
      year = d.getFullYear().toString();
    } else if (/^\d{8}$/.test(value)) {
      day = value.substring(0, 2);
      month = value.substring(2, 4);
      year = value.substring(4, 8);
    } else {
      return value;
    }
    return `${day}/${month}/${year}`;
  }

  parseDDMMYYYY(value: string): Date | null {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4)) - 1;
    const year = Number(digits.slice(4, 8));
    const d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
    return d;
  }

  onDateInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length >= 5) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    else if (digits.length >= 3) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    else formatted = digits;
    input.value = formatted;
    this.dateDisplay = formatted;
    const parsed = this.parseDDMMYYYY(formatted);
    this.form.get('birth_date')!.setValue(parsed ? this.toISO(parsed) : '');
    this.focused['birth_date'] = !!parsed;
  }

  onDateBlur() {
    const d = this.parseDDMMYYYY(this.dateDisplay);
    if (d) {
      this.form.get('birth_date')!.setValue(this.toISO(d));
      this.dateDisplay = this.formatDisplayDate(this.toISO(d));
      this.focused['birth_date'] = true;
    } else if (!this.dateDisplay) {
      this.focused['birth_date'] = false;
    }
  }

  openCalendar() {
    if (this.calendarOpen) {
      this.closeCalendar();
      return;
    }
    this.calendarOpen = true;
    const value = this.form.get('birth_date')!.value;
    if (value) {
      const parts = value.split('-').map(n => parseInt(n, 10));
      if (parts.length === 3) {
        this.calYear = parts[0];
        this.calMonth = parts[1] - 1;
      }
    }
    this.generateCalendar(this.calYear, this.calMonth);
  }

  closeCalendar() {
    this.calendarOpen = false;
  }

  pickDate(date: Date) {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.form.get('birth_date')!.setValue(this.toISO(localDate));
    this.dateDisplay = this.formatDisplayDate(this.toISO(localDate));
    this.focused['birth_date'] = true;
    this.closeCalendar();
  }

  prevMonth() {
    this.calMonth === 0 ? (this.calMonth = 11, this.calYear--) : this.calMonth--;
    this.generateCalendar(this.calYear, this.calMonth);
  }

  nextMonth() {
    this.calMonth === 11 ? (this.calMonth = 0, this.calYear++) : this.calMonth++;
    this.generateCalendar(this.calYear, this.calMonth);
  }

  generateCalendar(year: number, month: number) {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: Array<{ d: Date | null; currentMonth: boolean }> = [];

    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ d: new Date(year, month - 1, prevMonthDays - i), currentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ d: new Date(year, month, day), currentMonth: true });
    }
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ d: new Date(year, month + 1, nextDay++), currentMonth: false });
    }

    this.weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.weeks.push(cells.slice(i, i + 7));
    }
  }

  isToday(date: Date | null) {
    if (!date) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  }

  selectedDateObj(): Date | null {
    const value = this.form.get('birth_date')!.value;
    if (!value) return null;
    const parts = value.split('-').map(n => parseInt(n, 10));
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  @HostListener('document:click', ['$event'])
  closeCalendarOnOutsideClick(ev: MouseEvent) {
    if (!this.calendarOpen) return;
    const target = ev.target as Node;
    if (this.dateWrapperEl?.nativeElement.contains(target)) return;
    this.closeCalendar();
  }

  onTouchStart(ev: TouchEvent) {
    this.touchStartX = ev.touches[0].clientX;
  }

  onTouchEnd(ev: TouchEvent) {
    this.touchEndX = ev.changedTouches[0].clientX;
    const dx = this.touchEndX - this.touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? this.nextMonth() : this.prevMonth();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.calendarOpen) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevMonth();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextMonth();
    }
  }

  private toISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Aplica máscara e impede caracteres não numéricos
  onCpfInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '').slice(0, 11);
    let out = digits;

    if (digits.length > 9)
      out = digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
    else if (digits.length > 6)
      out = digits.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    else if (digits.length > 3)
      out = digits.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');

    input.value = out;
    this.form.get('cpf')!.setValue(out);
    this.focused['cpf'] = !!out;
  }

  async validateCpf() {
    this.mainService.resetForm();
    // 🔹 Remove foco e fecha teclado no mobile
    this.blurInput();

    const cpf = this.form.get('cpf')!.value;
    if (!cpf) {
      this.showDialogMessage('Por favor, insira o CPF.');
      // 🔹 Marca para refocar depois que o usuário fechar o dialog
      this.shouldRefocus = true;
      return;
    }

    const birthDate = this.form.get('birth_date')!.value;
    if (!birthDate) {
      this.showDialogMessage('Por favor, insira uma data de nascimento válida.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      this.mainService.setFormValue('cpf', cpf);
      this.mainService.setFormValue('birthDate', birthDate);
      this.mainService.setFormValue('birth_date', this.dateDisplay.replace(/\D/g, ''));
      this.mainService.setFormValue('type', 1);
      const payload = this.mainService.getFormValues(true);
      const response: any = await this.mainService.customerAccessCheck(payload);
      this.isLoading = false;
      this.cdr.detectChanges();

      if (!response.status) {
        this.showDialogMessage(response.message || 'Erro na resposta.');
        this.shouldRefocus = true; // 🔹 Só refoca após fechar o diálogo
        return;
      }

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!data) {
        this.showDialogMessage('Nenhum dado retornado.');
        return;
      }

      // if (data.situacao && data.situacao.codigo != 0) {
      //   this.showDialogMessage('Situação: ' + data.situacao.descricao);
      //   this.shouldRefocus = true;
      //   return;
      // }

      this.mainService.setFormValue('name', data.nome || '');

      if (data.email1) {
        this.mainService.setFormValue('email', data.email1);
      }

      if (data.codigo) {
        this.mainService.setFormValue('code', data.codigo);
      }

      if (data.tel1ddd && data.tel1) {
        this.mainService.setFormValue('update', 1);
        this.mainService.setFormValue('phone', data.tel1ddd + data.tel1);
      }

      this.cdr.detectChanges();

      this.cpfValidated.emit({
        nome: data.nome,
        nascimento: birthDate,
      });

      this.updateVisible(3);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro:', error);
      this.isLoading = false;
      this.showDialogMessage('Erro ao consultar CPF.');
    }
  }

  /** 🔹 Remove foco do input e fecha o teclado (mobile) */
  blurInput() {
    if (this.cpfInputEl?.nativeElement) {
      this.cpfInputEl.nativeElement.blur();
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }

  focusField(field: string) {
    if (field === 'cpf' && this.cpfInputEl) {
      setTimeout(() => {
        this.cpfInputEl.nativeElement.focus();
        this.cdr.detectChanges();
      }, 50);
    }
  }

  showDialogMessage(msg: string) {
    this.dialogMessage = msg;
    this.showDialog = true;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.showDialog = false;
    this.cdr.detectChanges();
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
