/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import '../shared/expandable_content/expandable_tab.js';
import '../shared/dropdown/dropdown.js';
import '../shared/checkbox/checkbox.js';
import '@polymer/paper-item';

import {customElement, html, internalProperty, query} from 'lit-element';

import {reduxStore} from '../../space_opera_base.js';
import {State} from '../../types.js';
import {dispatchAnimationName, dispatchAutoplayEnabled, getConfig} from '../config/reducer';
import {ConnectedLitElement} from '../connected_lit_element/connected_lit_element.js';
import {getModelViewer} from '../model_viewer_preview/reducer.js';
import {CheckboxElement} from '../shared/checkbox/checkbox.js';
import {Dropdown} from '../shared/dropdown/dropdown.js';

/**
 * Animation controls for gltf and model-viewer.
 */
@customElement('me-animation-controls')
export class AnimationControls extends ConnectedLitElement {
  @query('me-checkbox#animation-autoplay') autoplayCheckbox?: CheckboxElement;
  @internalProperty() animationNames: string[] = [];
  @internalProperty() selectedAnimation: string|undefined = undefined;
  @internalProperty() autoplay: boolean = false;

  stateChanged(state: State) {
    this.animationNames = getModelViewer()?.availableAnimations ?? [];
    const config = getConfig(state);
    this.selectedAnimation = config.animationName;
    this.autoplay = !!config.autoplay;
  }

  render() {
    let selectedAnimationIndex = this.selectedAnimation ?
        this.animationNames.findIndex(
            (name) => name === this.selectedAnimation) :
        0;  // Select first animation as model-viewer default

    if (selectedAnimationIndex === -1) {
      selectedAnimationIndex = 0;
    }

    const hasAnims = this.animationNames.length > 0;
    const tabHeader = hasAnims ? 'Animations' : 'Animations (Model has none)';
    return html`
      <me-expandable-tab tabName=${tabHeader} .enabled=${hasAnims}>
        <div slot="content">
          <me-dropdown id="animation-name-selector"
            selectedIndex=${selectedAnimationIndex}
            @select=${this.onAnimationNameChange}>
            ${this.animationNames.map(name => {
      return html`
              <paper-item value="${name}">
                ${name}
              </paper-item>`;
    })}
          </me-dropdown>
          <me-checkbox id="animation-autoplay" label="Autoplay"
            ?checked="${!!this.autoplay}"
            @change=${this.onAutoplayChange}></me-checkbox>
        </div>
      </me-expandable-tab>
        `;
  }

  onAutoplayChange() {
    const {checked} = this.autoplayCheckbox!;
    reduxStore.dispatch(dispatchAutoplayEnabled(checked));
    if (checked === false) {
      getModelViewer()?.pause();
    }
  }

  onAnimationNameChange(event: CustomEvent) {
    // Autoplay must be enabled otherwise the animation won't play and the
    // console throws a warning.
    const dropdown = event.target as Dropdown;
    const value = dropdown.selectedItem?.getAttribute('value') || undefined;
    if (value !== undefined && this.animationNames.indexOf(value) !== -1) {
      reduxStore.dispatch(dispatchAnimationName(value));
      reduxStore.dispatch(dispatchAutoplayEnabled(true));
    }
  }
}

declare global {
  interface AnimationControls {
    'me-animation-controls': AnimationControls;
  }
}
