// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CronJobDetail} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {Subscription} from 'rxjs/Subscription';
import {RawResource} from '../../../../common/resources/rawresource';
import {NotificationsService} from '../../../../common/services/global/notifications';
import {EndpointManager, Resource} from '../../../../common/services/resource/endpoint';
import {NamespacedResourceService} from '../../../../common/services/resource/resource';
import {ActionbarService, ResourceMeta} from '../../../services/global/actionbar';

@Component({
  selector: '',
  templateUrl: './template.html',
})
export class SuspendActionbarComponent implements OnInit {
  private cronJobSubscription_: Subscription;
  cronJob: CronJobDetail;

  isInitialized = false;
  isSuspended = false;
  resourceMeta: ResourceMeta;
  resourceMetaSubscription_: Subscription;

  constructor(private readonly cronJob_: NamespacedResourceService<CronJobDetail>,
              private readonly notifications_: NotificationsService,
              private readonly actionbar_: ActionbarService,
              private readonly state_: StateService,
              private readonly http_: HttpClient) {}

  ngOnInit(): void {
    this.resourceMetaSubscription_ =
        this.actionbar_.onInit.subscribe((resourceMeta: ResourceMeta) => {
          this.resourceMeta = resourceMeta;
          this.cronJobSubscription_ =
              this.cronJob_
                .get(EndpointManager.resource(Resource.cronJob, true).detail(), this.resourceMeta.objectMeta.name)
                .startWith({})
                .subscribe((d: CronJobDetail) => {
                    this.cronJob = d;
                    this.isSuspended = d.suspend;
                    this.notifications_.pushErrors(d.errors);
                    this.isInitialized = true;
            });
        });
  }

  ngOnDestroy(): void {
    this.resourceMetaSubscription_.unsubscribe();
  }

  // TODO move this logic to a service
  // --- SERVICE LOGIC START ---
  suspend(): void {
    this.toggleCronJob(true);
  }

  resume(): void {
    this.toggleCronJob(false);
  }

  toggleCronJob(suspended:boolean):void{
        const url = RawResource.getUrl(this.resourceMeta.typeMeta, this.resourceMeta.objectMeta);
    this.http_.get<RawCronJob>(url).toPromise().then((response) => {
      response.spec.suspend = suspended;
      return response;
    }).then ((response) => {
      this.http_.put(url, response, {headers: this.getHttpHeaders_()}).subscribe(() => {
        this.state_.reload().catch();
        // TODO handle result
      }); // TODO handle errors
    });
  }

  getHttpHeaders_(): HttpHeaders {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  }

    // --- SERVICE LOGIC END ---
}

interface RawCronJob {
  spec: RawCronJobSpec;
}

interface RawCronJobSpec {
  suspend: boolean;
}
