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
  image: new FormControl('')
});

export let Token: string = '';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  constructor(private apiService: ApiService) {}

  async getCpf(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/cpf/${this.getToken()}`,payload,'CPF Consultation');
  }

  async customerSendEmail(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customersendemail/${this.getToken()}`,payload,'Send Email');
  }

  async customerAccessValidity(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessvalidity/${this.getToken()}`,payload,'Validity Code');
  }

  async customerAccessRegister(payload: any) {
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessregister/${this.getToken()}`,payload,'Register Customer');
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
    return await this.apiService.request(HttpMethod.POST,`/crm/customeraccessactive/${this.getToken()}`,payload,'Customer Active');
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
      image: ''
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
}
