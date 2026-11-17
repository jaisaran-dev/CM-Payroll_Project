import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationDialog } from './shared/components/confirmation-dialog/confirmation-dialog';
import { Toast } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationDialog, Toast],
  templateUrl: './app.html',
})
export class App {}
