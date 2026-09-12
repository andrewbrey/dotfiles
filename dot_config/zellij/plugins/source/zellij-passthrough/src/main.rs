use std::collections::BTreeMap;
use zellij_tile::prelude::*;

#[derive(Default)]
struct Plugin {
    armed_pane: Option<(PaneId, String)>,
    bindings_removed: bool,
    indicator_visible: bool,
    original_bindings: Option<Vec<(KeyWithModifier, Vec<actions::Action>)>>,
    panes: PaneManifest,
    active_tab: Option<usize>,
}

register_plugin!(Plugin);

impl ZellijPlugin for Plugin {
    fn load(&mut self, _configuration: BTreeMap<String, String>) {
        request_permission(&[
            PermissionType::ReadApplicationState,
            PermissionType::ChangeApplicationState,
            PermissionType::Reconfigure,
        ]);
        subscribe(&[
            EventType::InitialKeybinds,
            EventType::PaneUpdate,
            EventType::TabUpdate,
        ]);
    }

    fn update(&mut self, event: Event) -> bool {
        match event {
            Event::InitialKeybinds(keybinds) if self.original_bindings.is_none() => {
                if let Some((_, locked_bindings)) = keybinds
                    .into_iter()
                    .find(|(mode, _)| *mode == InputMode::Locked)
                {
                    self.capture_bindings(locked_bindings);
                }
            }
            Event::PaneUpdate(panes) => {
                self.panes = panes;
                self.synchronize();
            }
            Event::TabUpdate(tabs) => {
                self.active_tab = tabs
                    .into_iter()
                    .find(|tab| tab.active)
                    .map(|tab| tab.position);
                self.synchronize();
            }
            _ => {}
        }
        false
    }

    fn pipe(&mut self, message: PipeMessage) -> bool {
        if message.name == "toggle" {
            self.toggle();
        }
        false
    }
}

impl Plugin {
    fn capture_bindings(&mut self, bindings: Vec<(KeyWithModifier, Vec<actions::Action>)>) {
        let bindings = bindings
            .into_iter()
            .filter(|(key, _)| !is_toggle_key(key))
            .collect::<Vec<_>>();
        if !bindings.is_empty() {
            self.original_bindings = Some(bindings);
        }
    }

    fn toggle(&mut self) {
        if self.armed_pane.is_some() {
            self.restore_bindings();
            self.hide_indicator();
            self.armed_pane = None;
            return;
        }

        let Some(focused_pane) = self.focused_pane().cloned() else {
            return;
        };
        self.armed_pane = Some((pane_id(&focused_pane), focused_pane.title));
        self.synchronize();
    }

    fn synchronize(&mut self) {
        let armed_pane_id = self.armed_pane.as_ref().map(|(pane_id, _)| *pane_id);
        let focused_pane_id = self.focused_pane().map(pane_id);
        let passthrough_is_active = armed_pane_id.is_some() && armed_pane_id == focused_pane_id;

        if passthrough_is_active {
            self.remove_bindings();
            self.show_indicator();
        } else {
            self.restore_bindings();
            self.hide_indicator();
        }
    }

    fn focused_pane(&self) -> Option<&PaneInfo> {
        self.active_tab
            .and_then(|tab| self.panes.panes.get(&tab))
            .and_then(|panes| {
                panes
                    .iter()
                    .find(|pane| pane.is_focused && !pane.is_suppressed)
            })
    }

    fn remove_bindings(&mut self) {
        if self.bindings_removed {
            return;
        }
        let Some(original_bindings) = self.original_bindings.as_ref() else {
            return;
        };
        let keys_to_unbind = original_bindings
            .iter()
            .map(|(key, _)| (InputMode::Locked, key.clone()))
            .collect();
        rebind_keys(keys_to_unbind, Vec::new(), false);
        self.bindings_removed = true;
    }

    fn restore_bindings(&mut self) {
        if !self.bindings_removed {
            return;
        }
        let Some(original_bindings) = self.original_bindings.as_ref() else {
            return;
        };
        let keys_to_rebind = original_bindings
            .iter()
            .map(|(key, actions)| (InputMode::Locked, key.clone(), actions.clone()))
            .collect();
        rebind_keys(Vec::new(), keys_to_rebind, false);
        self.bindings_removed = false;
    }

    fn show_indicator(&mut self) {
        if self.indicator_visible {
            return;
        }
        let Some((pane_id, original_title)) = self.armed_pane.as_ref() else {
            return;
        };
        highlight_and_unhighlight_panes(vec![*pane_id], Vec::new());
        rename_pane_with_id(*pane_id, format!("{original_title} [PASSTHROUGH]"));
        self.indicator_visible = true;
    }

    fn hide_indicator(&mut self) {
        if !self.indicator_visible {
            return;
        }
        let Some((pane_id, original_title)) = self.armed_pane.as_ref() else {
            return;
        };
        highlight_and_unhighlight_panes(Vec::new(), vec![*pane_id]);
        rename_pane_with_id(*pane_id, original_title);
        self.indicator_visible = false;
    }
}

fn pane_id(pane: &PaneInfo) -> PaneId {
    if pane.is_plugin {
        PaneId::Plugin(pane.id)
    } else {
        PaneId::Terminal(pane.id)
    }
}

fn is_toggle_key(key: &KeyWithModifier) -> bool {
    key.bare_key == BareKey::F(12) && key.key_modifiers.is_empty()
}
