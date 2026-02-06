import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, {
  providers: [provideBrowserGlobalErrorListeners()],
}).catch(err => console.error(err));
