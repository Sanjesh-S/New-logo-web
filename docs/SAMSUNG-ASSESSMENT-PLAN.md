# Samsung Phone Assessment – Implementation Plan

## Goal
- **iPhone**: Keep current default flow (Basic Functionality → Device Condition → Functional Issues → Accessories → Age).
- **Samsung**: Use a different flow with Samsung-specific questions and labels.
- **S Pen**: Show S Pen questions only for Samsung Ultra/Note series (e.g. S24 Ultra, S23 Ultra, Note 20, Note 10), not for normal Galaxy series.

---

## 1. Step selection (brand-aware phones)

**Where:** `AssessmentWizard.tsx` – `getSteps()`.

**Change:** When category is phones, branch by **brand** (normalized, case-insensitive):

- **Apple** → `getPhoneSteps()` (current iPhone flow).
- **Samsung** → `getSamsungPhoneSteps()` (new Samsung flow).
- **Other brands** → Default to `getPhoneSteps()` (iPhone-style) until you add more brand-specific flows.

**Helper:** Normalize brand from URL/product, e.g. `Samsung`, `samsung` → Samsung; `Apple`, `apple` → Apple.

---

## 2. Samsung flow – 5 pages

### Page 1 – Basic Functionality
- **1.** Does the phone Power on? (Yes/No) → `powerOn`
- **2.** Does the camera Function properly? (Yes/No) → `cameraWorking`

Reuse existing `YesNoQuestion` and same answer keys as iPhone Page 1 (no IMEI/Serial/True Tone/Face ID here).

---

### Page 2 – Device Condition (Samsung-specific)

Single step that groups several sections. Prefer **one new component** (e.g. `SamsungDeviceConditionStep`) that composes:

| Section | Type | Answer key(s) | Notes |
|--------|------|----------------|-------|
| **Display condition** | Single select | `displayCondition` | Options: `goodWorking`, `screenLine`, `minorCrack`, `majorDamage`. Add `screenLine` to options (new). |
| **Battery health** | Single select | `batteryHealthSamsung` or reuse `batteryHealthRange` | Options: `normalGood` (80–100%), `actionRequired` (below 80%). Labels: “Normal / Good (80% to 100%)”, “Action Required (Below 80%)”. Helper: “Check via Settings > Battery and Device Care > Diagnostics. Samsung uses Life: Good/Weak.” |
| **Biometrics** | Two Yes/No or single multi-select | `fingerprintWorking`, `faceRecognitionWorking` | Labels: “Fingerprint working properly (In-display sensor)”, “Face Recognition working”. |
| **Display features** | Two Yes/No | `display120Hz`, `eyeComfortShield` | Labels: “120Hz / High Refresh Rate available and smooth”, “Eye Comfort Shield (Blue light filter) working”. |
| **S Pen** (conditional) | Only if `isSamsungSPenModel(model)` | See below | Sub-section with 4 Yes/No questions. |
| **Camera condition** | Single select | `cameraCondition` | Options: `cameraGood`, `frontCameraNotWorking`, `backCameraNotFocusing`. Add `backCameraNotFocusing` (“Back camera / 100x Zoom not focusing”) if not already in types; can map to existing `backCameraNotWorking` for pricing if you prefer. |

**S Pen sub-questions (only for Ultra/Note):**

- S Pen tip/nib condition: “Physical condition: Tip (nib) not worn out or broken.” → `sPenTipGood` (Yes/No).
- Writing/touch: “Does it write smoothly across the entire screen?” → `sPenWriting` (Yes/No).
- Air Actions: “Does the S Pen button work as a remote (e.g., to take a photo)?” → `sPenAirActions` (Yes/No).
- Charging/connectivity: “Does it show as ‘Connected’ and ‘Charging’ when docked?” → `sPenCharging` (Yes/No).

**S Pen model detection:**  
`isSamsungSPenModel(model: string)`: return true if `model.toLowerCase()` contains `'note'` or `'ultra'` (covers Note 10/20, S22 Ultra, S23 Ultra, S24 Ultra, etc.).

---

### Page 3 – Functional issues
Reuse **PhoneIssueGrid** with a **Samsung-specific issue list** (same component, different config):

- Microphone / Speaker issues → `microphoneIssue`, `speakerIssue` (or one “audio” issue if you prefer).
- Charging port / Wireless Charging issues → `chargingPortIssue`, add `wirelessChargingIssue` if you want separate pricing.
- Touch screen unresponsive → `touchScreenIssue`
- WIFI / Bluetooth / NFC issues → `wifiIssue`; add `nfcIssue` if needed.
- Buttons (Power/Volume) → `buttonIssue`
- Frame / Body / Water damage → `frameDamageIssue`, `bodyDamageIssue`, `waterDamageIssue`
- Network / SIM card issue → `networkIssue`; add `simCardIssue` if you want it separate.

**Implementation:** Either pass an `issues` prop into `PhoneIssueGrid` (list of `{ id, label, icon }`) or create `SamsungIssueGrid` that uses the Samsung list and same UX. Same answer key `functionalIssues` (array of issue IDs).

---

### Page 4 – Accessories
Samsung list:

- Original Super-Fast Charger → `superFastCharger`
- Original Box → `box`
- Original Cable → `cable`
- Original S Pen (with note: “Replacement pens often lack Bluetooth/Air Actions”) → `sPen` (only show for S Pen models if you want; otherwise always show and “N/A” for non–S Pen devices).
- Phone case → `case`
- Screen protector → `screenProtector`

**Implementation:** Either extend **PhoneAccessoryGrid** with a `variant="samsung"` that switches labels/IDs, or add **SamsungAccessoryGrid** with this list. Reuse same answer key `accessories` (array).

---

### Page 5 – Age of the device
Reuse **AgeQuestion** and `age` answer key (same as iPhone).

---

## 3. New / updated building blocks

| Item | Action |
|------|--------|
| **Display “Screen Line”** | Add option `screenLine` to display condition where Samsung flow is used (e.g. in `DeviceConditionGrid` via prop or in `SamsungDeviceConditionStep`). |
| **Battery (Samsung)** | Use two options (Normal/Good vs Action Required); either new key `batteryHealthSamsung` or reuse `batteryHealthRange` with two options and Samsung-specific labels in the step. |
| **Biometrics / Display features / S Pen** | New Yes/No keys in answers and (later) in pricing rules. |
| **Camera “Back / 100x not focusing”** | Add `backCameraNotFocusing` to camera condition options for Samsung (or alias to `backCameraNotWorking` in pricing). |
| **SamsungDeviceConditionStep** | New component that renders Display condition, Battery, Biometrics, Display features, optional S Pen block, Camera condition. Can use existing grids/inputs where possible. |
| **Samsung accessories** | New IDs: `superFastCharger`, `sPen`, `screenProtector`. Rest reuse `box`, `cable`, `case`. |
| **Samsung functional issues** | Same IDs as current phone where they match; add `wirelessChargingIssue`, `nfcIssue`, `simCardIssue` only if you need them for pricing. |

---

## 4. Data & pricing

- **Answer keys:** Add Samsung-only keys to your assessment answer type (e.g. in `AnswerMap` or wherever you type assessment answers): `batteryHealthSamsung`, `fingerprintWorking`, `faceRecognitionWorking`, `display120Hz`, `eyeComfortShield`, `sPenTipGood`, `sPenWriting`, `sPenAirActions`, `sPenCharging`, `displayCondition.screenLine`, `cameraCondition.backCameraNotFocusing`, accessories `superFastCharger`, `sPen`, `screenProtector`.
- **Pricing rules (`lib/types/pricing.ts`):** Extend `PricingRules.questions` (and condition/accessory blocks if needed) with Samsung-specific keys so admin can set modifiers for Samsung-only questions. Optional: separate “Samsung default” pricing rules loaded when brand is Samsung.
- **Modifiers (`lib/pricing/modifiers.ts`):** When category is phones and brand is Samsung, apply Samsung question/condition/accessory modifiers (same pattern as existing phone/camera). Ignore iPhone-only keys (e.g. `trueTone`, `imeiNumber`, `serialNumber`) for Samsung.

---

## 5. Validation & step completion

- **Samsung Page 1:** Required: `powerOn`, `cameraWorking`.
- **Samsung Page 2:** Required: `displayCondition`, battery health field, both biometrics, both display features, `cameraCondition`; if S Pen section is shown, require all four S Pen answers (or define your own rule).
- **Samsung Page 3–5:** Same idea as iPhone (at least one selection or “No issues”, accessories optional, age required).

In `canProceed()`, when the current step is Samsung’s basic-functionality or device-condition step, check the corresponding required keys for Samsung (and optionally branch on `brand === 'Samsung'` so one block handles Samsung, another iPhone).

---

## 6. Implementation order

1. **Branch by brand in `getSteps()`**  
   Normalize brand; if phones + Samsung → `getSamsungPhoneSteps()`, else → `getPhoneSteps()`.

2. **Implement `getSamsungPhoneSteps()`**  
   - Page 1: two Yes/No questions (powerOn, cameraWorking).  
   - Page 2: placeholder or simple div, then replace with full content.  
   - Page 3: use PhoneIssueGrid with Samsung issue list (or SamsungIssueGrid).  
   - Page 4: use Samsung accessory list (variant or new grid).  
   - Page 5: AgeQuestion.

3. **Add `isSamsungSPenModel(model)`**  
   Use it in step 2 to show/hide S Pen block and optionally in Page 4 for S Pen accessory.

4. **Build Samsung Page 2**  
   Create `SamsungDeviceConditionStep`: display condition (with `screenLine`), battery (Samsung labels), biometrics (2 Yes/No), display features (2 Yes/No), conditional S Pen (4 Yes/No), camera condition (with Back/100x option).

5. **Types and pricing**  
   Add new answer keys and PricingRules entries for Samsung; update modifiers to apply them when brand is Samsung.

6. **Validation**  
   Update `canProceed()` for Samsung Page 1 and Page 2 (and any other required steps).

7. **Admin (optional)**  
   In PricingCalculator/Config, when product is Samsung phone, show Samsung question/condition/accessory fields so you can set modifiers per product.

---

## 7. File checklist

| File | Changes |
|------|--------|
| `components/AssessmentWizard.tsx` | Branch getSteps() by brand; add getSamsungPhoneSteps(); add canProceed() for Samsung; optional: pass brand into steps. |
| `components/SamsungDeviceConditionStep.tsx` (new) | Display, battery, biometrics, display features, S Pen (conditional), camera condition. |
| `components/questions/DeviceConditionGrid.tsx` or new step | Support `screenLine` and Samsung battery/camera options if you prefer not to duplicate logic. |
| `components/questions/PhoneIssueGrid.tsx` | Accept optional `issues` prop for Samsung list; else add `SamsungIssueGrid.tsx`. |
| `components/questions/PhoneAccessoryGrid.tsx` | Add `variant="samsung"` and Samsung list; else add `SamsungAccessoryGrid.tsx`. |
| `lib/types/pricing.ts` | New question/condition/accessory keys for Samsung; add `backCameraNotFocusing`, `screenLine` if needed. |
| `lib/pricing/modifiers.ts` | Apply Samsung-only modifiers when category is phones and brand is Samsung. |
| `lib/utils/assessmentLabels.ts` | Labels for new keys (admin display). |

---

## 8. S Pen conditional summary

- **Detection:** `model` includes “note” or “ultra” (case-insensitive).
- **Where:**  
  - Page 2: show “S Pen Specifics” block only when `isSamsungSPenModel(model)` is true.  
  - Page 4: show “Original S Pen” accessory for all Samsung phones (user can select N/A on non–S Pen devices) or hide it when not S Pen model; either is valid.

This keeps iPhone flow unchanged, adds a clear Samsung path, and limits S Pen questions to Ultra/Note series while reusing existing components and types where possible.
