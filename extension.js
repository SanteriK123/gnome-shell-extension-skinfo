/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { getRestaurantMenus } from "./getmenu.js";

const Skinfo = GObject.registerClass(
  class Skinfo extends PanelMenu.Button {
    _init(path) {
      super._init(0.0, "skinfo");
      const coffeeIcon = Gio.icon_new_for_string(
        path + "/icons/coffee-symbolic.svg",
      );

      // Indicator icon
      this.add_child(
        new St.Icon({
          gicon: coffeeIcon,
          style_class: "system-status-icon",
        }),
      );

      this.foodSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this.foodSection);

      // Create the restaurant submenus and the foods inside them
      this._createMenu();

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Button for refreshing the menu if it hasn't updated
      let refreshButton = new PopupMenu.PopupMenuItem(_("Refresh list"));
      refreshButton.connect("activate", () => {
        this._createMenu();
      });

      this.menu.addMenuItem(refreshButton);
    }

    async _createMenu() {
      this.foodSection.removeAll();

      try {
        const menu = await getRestaurantMenus();

        for (let restaurantName in menu) {
          const restaurantSubMenu = new PopupMenu.PopupSubMenuMenuItem(
            restaurantName,
            false,
            {},
          );

          let menuItems = menu[restaurantName];

          for (let item of menuItems) {
            let menuItem = new PopupMenu.PopupMenuItem(
              `${item.category}: ${item.title}`,
            );

            let label = menuItem.label;

            // Use wrapping so long food names don't widen the menu too much
            label.clutter_text.line_wrap = true;
            menuItem.actor.width = 250;

            restaurantSubMenu.menu.addMenuItem(menuItem);
          }

          this.foodSection.addMenuItem(restaurantSubMenu);
          this.foodSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this.menu.addMenuItem(foodSection);
      } catch (e) {
        console.debug("Something went wrong.");
      }
    }
  },
);

export default class SkinfoExampleExtension extends Extension {
  enable() {
    this._indicator = new Skinfo(this.path);
    Main.panel.addToStatusArea(this.uuid, this._indicator, -1, "left");
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}
