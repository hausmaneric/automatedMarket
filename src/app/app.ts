import { ChangeDetectorRef, Component, Inject, PLATFORM_ID, signal } from '@angular/core';
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
import { FinishComponent } from "./components/finish.component/finish.component";
import { Main2Component } from "./components/main2.component/main2.component";
import { Main3Component } from "./components/main3.component/main3.component";
import { LoginComponent } from "./components/login.component/login.component";
import { RecoverComponent } from "./components/recover.component/recover.component";
import { Confirmation2Component } from "./components/confirmation2.component/confirmation2.component";
import { Recover2Component } from "./components/recover2.component/recover2.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MainComponent,
    RegisterComponent,
    ConfirmationComponent,
    FaceComponent,
    TermComponent,
    DocumentComponent,
    FinishComponent,
    Main2Component,
    Main3Component,
    LoginComponent,
    RecoverComponent,
    Confirmation2Component,
    Recover2Component
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

  constructor(private mainService: MainService, private route: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        this.error = true;
        this.errorMessage = 'URL inválida! Faltam parâmetros obrigatórios.';
        return;
      }

      this.mainService.saveToken(token);
      const response: any = await this.mainService.customerAccessAppConfig();

      if (response.status) {
        // Decodifica o CSS Base64
        const decodedCss = this.base64ToString(response.data.css);

        // Extrai todas as variáveis CSS (nome e valor)
        const cssVars = Object.fromEntries(
          Array.from(decodedCss.matchAll(/(--[\w-]+):\s*([^;]+);/g), m => [m[1], m[2].trim()])
        );

        // Aplica dinamicamente cada variável ao :root
        for (const [key, value] of Object.entries(cssVars)) {
          document.documentElement.style.setProperty(key, value);
        }

        const decodedTerm = this.base64ToString(response.data.terms);
        this.mainService.saveTerm(decodedTerm);
        this.mainService.saveImg(response.data.logo);
        this.mainService.saveCompany(response.data.company);
        this.mainService.saveTrade(response.data.trade);
      }

      this.error = false;
      this.visible = 1;
      this.onVisibleChanged(1);
    }
  }

  onCpfValidated(data: { nome: string; nascimento: string }) {
    this.nomePessoa = data.nome;
    this.nascimentoPessoa = data.nascimento;
  }

  onVisibleChanged(value: number) {
    this.visible = value;
    this.cdr.detectChanges();
  }

  base64ToString(base64: string): string {
    return decodeURIComponent(escape(atob(base64)));
  }
}
