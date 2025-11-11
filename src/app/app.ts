import { Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { MainService } from './services/main.service';
import { MainComponent } from "./components/main.component/main.component";
import { RegisterComponent } from "./components/register.component/register.component";
import { ConfirmationComponent } from "./components/confirmation.component/confirmation.component";
import { FaceComponent } from "./components/face.component/face.component";
import { TermComponent } from "./components/term.component/term.component";
import { DocumentComponent } from "./components/document.component/document.component";
import { ApiService } from './services/api.service';
import { LoadingComponent } from './components/loading/loading.component';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MainComponent,
    RegisterComponent,
    ConfirmationComponent,
    FaceComponent,
    TermComponent,
    DocumentComponent
  ],
  providers:[MainService, ApiService],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  visible:   number  = 0;
  nomePessoa = '';
  nascimentoPessoa = '';
  error: boolean = false;
  errorMessage: string = '';

  protected readonly title = signal('NEXT - Identificação Facial');

  constructor(private mainService: MainService, private route: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Só executa no navegador
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      console.log('Token recebido:', token);

      if (!token) {
        this.error = true;
        this.errorMessage = 'URL inválida! Faltam parâmetros obrigatórios.';
      } else {
        this.mainService.saveToken(token);
        this.error = false;
        this.visible = 1;
        this.onVisibleChanged(1);
      }
    }
  }

  onCpfValidated(data: { nome: string; nascimento: string }) {
    this.nomePessoa = data.nome;
    this.nascimentoPessoa = data.nascimento;
  }

  onVisibleChanged(value: number) {
    this.visible = value;
  }
}
