import { Injectable } from '@angular/core';
import { ApiService, HttpMethod } from './api.service';
import { FormControl, FormGroup } from '@angular/forms';

export let form = new FormGroup({
  code: new FormControl(''),
  cpf: new FormControl(''),
  name: new FormControl(''),
  phone: new FormControl(''),
  email: new FormControl(''),
  birthDate: new FormControl(''),
  // apartment: new FormControl(''),
  password: new FormControl(''),
  confirmPassword: new FormControl(''),
  codeAccess: new FormControl(''),
  image: new FormControl(''),
  type: new FormControl(0),
  update: new FormControl(0),
});

export let Img: string = '';
export let Term: string = '';
export let Company: string = '';
export let Trade: string = '';
export let Token: string = '';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  constructor(private apiService: ApiService) {}

  async getCpf(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/cpfauto/${this.getToken()}`,payload,'CPF Consultation');
  }

  async customerSendEmail(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customersendemail/${this.getToken()}`,payload,'Send Email');
  }

  async customerAccessValidity(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessvalidate/${this.getToken()}`,payload,'Validity Code');
  }

  async customerAccessRegister(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessregister/${this.getToken()}`,payload,'Register Customer');
  }

  async customerAccessUpdate(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessupdate/${this.getToken()}`,payload,'Update Customer');
  }

  async customerAccessPassword(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccesspassword/${this.getToken()}`,payload,'Password Customer');
  }

  async customerAccessFace(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessface/${this.getToken()}`,payload,'Face Customer');
  }

  async customerAccessDelete(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessdelete/${this.getToken()}`,payload,'Delete Customer');
  }

  async customerAccessLogin(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccesslogin/${this.getToken()}`,payload,'Customer Login');
  }

  async customerAccessActive(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessactivate/${this.getToken()}`,payload,'Customer Active');
  }

  async customerAccessRecover(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessrecover/${this.getToken()}`,payload,'Recover Client');
  }

  async customerAccessAppConfig() {
    return await this.apiService.request(HttpMethod.GET,`/crm/customeraccessappconfig/${this.getToken()}`,'Customer Config');
  }

  setFormValue(field: string, value: any) {
    const control = form.get(field);
    if (control) control.setValue(value);
  }

  getFormValue(field: string) {
    const control = form.get(field);
    return control ? control.value : null;
  }

  resetForm() {
    form.reset({
      cpf: '',
      name: '',
      phone: '',
      email: '',
      birthDate: '',
      // apartment: '',
      password: '',
      confirmPassword: '',
      image: '',
      type: 0,
      update: 0,
    });
  }

  getFormValuesList() {
    return [form.getRawValue()];
  }

  getFormValues() {
    return form.getRawValue();
  }

  getToken() {
    return Token;
  }

  saveToken(token: string): void {
    Token = token;
  }

  getImg() {
    return Img;
  }

  saveImg(img: string): void {
    Img = img;
  }

  getTerm() {
    return Term;
  }

  saveTerm(term: string): void {
    Term = term;
  }

  getCompany() {
    return Company;
  }

  saveCompany(company: string): void {
    Company = company;
  }

  getTrade() {
    return Trade;
  }

  saveTrade(trade: string): void {
    Trade = trade;
  }
}
