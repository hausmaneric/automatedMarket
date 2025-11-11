import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-main',
  imports: [MatIconModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  @Output() visibleChange = new EventEmitter<number>();

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
