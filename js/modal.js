/**
 * WOW Theorie - Aanmeldings Modal
 * Multi-stap aanmeldproces
 */
(function () {
    'use strict';

    /* ─── Config ─────────────────────────────────────────── */
    var PROVINCES = [
        'Groningen', 'Friesland', 'Drenthe', 'Overijssel',
        'Flevoland', 'Gelderland', 'Utrecht', 'Noord-Holland',
        'Zuid-Holland', 'Zeeland', 'Noord-Brabant', 'Limburg'
    ];

    var COURSES = [
        { id: 'auto',        name: 'Auto Theorie',       type: 'Personenauto',         icon: 'fa-solid fa-car' },
        { id: 'motor',       name: 'Motor Theorie',      type: 'Motor',                icon: 'fa-solid fa-motorcycle' },
        { id: 'scooter',     name: 'Scooter Theorie',    type: 'Scooter / Bromfiets',  icon: 'fa-solid fa-bolt' },
        { id: 'vrachtwagen', name: 'Vrachtwagen Theorie',type: 'Vrachtwagen',          icon: 'fa-solid fa-truck' },
        { id: 'bus',         name: 'Bus Theorie',        type: 'Bus / Personenvervoer',icon: 'fa-solid fa-bus' }
    ];

    var EXTRA_OPTIES = [
        { id: 'only-cursus',      label: 'Ik wil alleen de cursus',     desc: 'Examen is al ingepland bij het CBR' },
        { id: 'verlengd-examen',  label: 'Ik wil een verlengd examen',  desc: 'Voor kandidaten met dyslexie' }
    ];

    var STEP_LABELS = ['Cursus', 'Provincie', 'Datum', "Extra's", 'Gegevens', 'Bevestig'];
    var MONTH_NAMES = ['januari','februari','maart','april','mei','juni',
                       'juli','augustus','september','oktober','november','december'];
    var DAY_NAMES   = ['ma','di','wo','do','vr','za','zo'];

    /* ─── State ──────────────────────────────────────────── */
    var state = makeState();

    function makeState(preselect) {
        return {
            step: 1,
            cursus:    preselect || null,
            provincie: null,
            datum:     null,
            extras:    [],
            akkoord:   false,
            g: { voornaam:'', achternaam:'', geboortedatum:'', email:'',
                 telefoon:'', postcode:'', huisnummer:'', straat:'', stad:'' }
        };
    }

    /* ─── HTML Builders ──────────────────────────────────── */
    function buildProgressHTML() {
        var h = '';
        for (var i = 1; i <= 6; i++) {
            h += '<div class="wow-modal__progress-step" id="wowPStep' + i + '">' +
                 '<div class="wow-modal__progress-bubble">' + i + '</div>' +
                 '<div class="wow-modal__progress-label">' + STEP_LABELS[i - 1] + '</div>' +
                 '</div>';
            if (i < 6) h += '<div class="wow-modal__progress-line" id="wowPLine' + i + '"></div>';
        }
        return h;
    }

    function buildStep1() {
        var cards = COURSES.map(function (c) {
            return '<div class="wow-modal__course-card" data-course="' + c.id + '" tabindex="0" role="button">' +
                   '<div class="wow-modal__course-icon"><i class="' + c.icon + '"></i></div>' +
                   '<div class="wow-modal__course-name">' + c.name + '</div>' +
                   '<div class="wow-modal__course-type">' + c.type + '</div>' +
                   '</div>';
        }).join('');

        return '<div class="wow-modal__step is-active" id="wowStep1">' +
               '<div class="wow-modal__step-title">Welke cursus wil je volgen?</div>' +
               '<div class="wow-modal__step-subtitle">Kies het type theoriecursus waarvoor je je wilt aanmelden.</div>' +
               '<div class="wow-modal__course-grid">' + cards + '</div>' +
               '</div>';
    }

    function buildStep2() {
        var btns = PROVINCES.map(function (p) {
            return '<button class="wow-modal__province-btn" data-province="' + p + '">' + p + '</button>';
        }).join('');

        return '<div class="wow-modal__step" id="wowStep2">' +
               '<div class="wow-modal__step-title">In welke provincie wil je de cursus?</div>' +
               '<div class="wow-modal__step-subtitle">Kies de provincie waar jij de cursus wilt volgen.</div>' +
               '<div class="wow-modal__province-grid">' + btns + '</div>' +
               '</div>';
    }

    function buildStep3() {
        return '<div class="wow-modal__step" id="wowStep3">' +
               '<div class="wow-modal__step-title">Kies je voorkeursdatum</div>' +
               '<div class="wow-modal__step-subtitle">Beschikbare data zijn maandag t/m zaterdag. Eerste beschikbare datum is 1 week na vandaag.</div>' +
               '<div class="wow-modal__calendars" id="wowCalendars"></div>' +
               '</div>';
    }

    function buildStep4() {
        var opts = EXTRA_OPTIES.map(function (o) {
            return '<div class="wow-modal__extra-option" data-extra="' + o.id + '" tabindex="0" role="checkbox" aria-checked="false">' +
                   '<div class="wow-modal__extra-checkbox"><i class="fa-solid fa-check" style="font-size:0.65rem;"></i></div>' +
                   '<div class="wow-modal__extra-info">' +
                   '<div class="wow-modal__extra-label">' + o.label + '</div>' +
                   '<div class="wow-modal__extra-desc">' + o.desc + '</div>' +
                   '</div></div>';
        }).join('');

        return '<div class="wow-modal__step" id="wowStep4">' +
               '<div class="wow-modal__step-title">Extra opties</div>' +
            '<div class="wow-modal__step-subtitle">Optioneel - selecteer wat op jou van toepassing is. Je kunt ook gewoon doorgaan.</div>' +
               '<div class="wow-modal__extras">' + opts + '</div>' +
               '<p class="wow-modal__extras-note"><i class="fa-solid fa-circle-info"></i> ' +
               'Deze opties zijn niet verplicht. Laat ze ongeselecteerd als ze niet van toepassing zijn.</p>' +
               '</div>';
    }

    function buildStep5() {
        return '<div class="wow-modal__step" id="wowStep5">' +
               '<div class="wow-modal__step-title">Jouw gegevens</div>' +
               '<div class="wow-modal__step-subtitle">Vul je persoonlijke gegevens in om de aanmelding te voltooien.</div>' +
               '<div class="wow-modal__error-msg" id="wowFormError">Controleer de gemarkeerde velden en probeer het opnieuw.</div>' +
               '<div class="wow-modal__form">' +

               '<div class="wow-modal__form-row">' +
               fld('grpVoornaam','Voornaam','inpVoornaam','text','Jan','given-name',true,'Voornaam is verplicht') +
               fld('grpAchternaam','Achternaam','inpAchternaam','text','de Vries','family-name',true,'Achternaam is verplicht') +
               '</div>' +

               fld('grpGeboorte','Geboortedatum','inpGeboorte','date','','bday',true,'Geboortedatum is verplicht') +

               '<div class="wow-modal__form-row">' +
               fld('grpEmail','E-mailadres','inpEmail','email','jan@email.nl','email',true,'Geldig e-mailadres verplicht') +
               fld('grpTelefoon','Telefoonnummer','inpTelefoon','tel','06-12345678','tel',true,'Telefoonnummer is verplicht') +
               '</div>' +

               '<div class="wow-modal__postcode-row">' +
               '<div class="wow-modal__form-group" id="grpPostcode">' +
               '<label class="wow-modal__form-label">Postcode <span>*</span></label>' +
               '<input type="text" class="wow-modal__form-input" id="inpPostcode" placeholder="1234 AB" maxlength="7" autocomplete="postal-code">' +
               '<span class="wow-modal__form-error">Geldige postcode verplicht (bijv. 1234 AB)</span>' +
               '<span class="wow-modal__postcode-status" id="postcodeStatus"></span>' +
               '</div>' +
               '<div class="wow-modal__form-group" id="grpHuisnummer">' +
               '<label class="wow-modal__form-label">Huisnummer <span>*</span></label>' +
               '<input type="text" class="wow-modal__form-input" id="inpHuisnummer" placeholder="12" autocomplete="address-line2">' +
               '<span class="wow-modal__form-error">Huisnummer is verplicht</span>' +
               '</div>' +
               '</div>' +

               '<div class="wow-modal__form-row">' +
               '<div class="wow-modal__form-group"><label class="wow-modal__form-label">Straat</label>' +
               '<input type="text" class="wow-modal__form-input" id="inpStraat" placeholder="Wordt automatisch ingevuld" autocomplete="address-line1"></div>' +
               '<div class="wow-modal__form-group"><label class="wow-modal__form-label">Stad</label>' +
               '<input type="text" class="wow-modal__form-input" id="inpStad" placeholder="Wordt automatisch ingevuld" autocomplete="address-level2"></div>' +
               '</div>' +

               '<div class="wow-modal__akkoord" id="wowAkkoord" tabindex="0" role="checkbox" aria-checked="false">' +
               '<div class="wow-modal__akkoord-box"><i class="fa-solid fa-check" style="font-size:0.65rem;"></i></div>' +
               '<div class="wow-modal__akkoord-text">Ik ga akkoord met de ' +
               '<a href="/contact" target="_blank" rel="noopener">algemene voorwaarden</a> van WOW Theorie. ' +
               'Door je aan te melden geef je toestemming om je contactgegevens te gebruiken voor het verwerken van je aanmelding.</div>' +
               '</div>' +
               '<div id="akkoordError" style="font-size:0.72rem;color:#dc2626;display:none;">Je moet akkoord gaan met de algemene voorwaarden.</div>' +
               '</div></div>';
    }

    function fld(grpId, label, inputId, type, placeholder, autocomplete, required, errMsg) {
        return '<div class="wow-modal__form-group" id="' + grpId + '">' +
               '<label class="wow-modal__form-label">' + label + (required ? ' <span>*</span>' : '') + '</label>' +
               '<input type="' + type + '" class="wow-modal__form-input" id="' + inputId + '"' +
               ' placeholder="' + placeholder + '" autocomplete="' + autocomplete + '">' +
               '<span class="wow-modal__form-error">' + errMsg + '</span>' +
               '</div>';
    }

    function buildStep6() {
        return '<div class="wow-modal__step" id="wowStep6">' +
               '<div class="wow-modal__step-title">Controleer je aanmelding</div>' +
               '<div class="wow-modal__step-subtitle">Klopt alles? Klik op <strong>Verzenden</strong> om je aanmelding in te sturen.</div>' +
               '<div class="wow-modal__error-msg" id="wowSendError">Er is een fout opgetreden bij het verzenden. Probeer het opnieuw.</div>' +
               '<div class="wow-modal__summary" id="wowSummary"></div>' +
               '</div>';
    }

    function buildStepSuccess() {
        return '<div class="wow-modal__step" id="wowStepSuccess">' +
               '<div class="wow-modal__success">' +
               '<div class="wow-modal__car-animation">' +
               '<div class="wow-modal__car">🚗</div>' +
               '<div class="wow-modal__road"></div>' +
               '</div>' +
               '<div class="wow-modal__checkmark">✓</div>' +
               '<div class="wow-modal__success-title">Aanmelding verstuurd! 🎉</div>' +
               '<p class="wow-modal__success-text">Super! Je aanmelding is succesvol ontvangen. ' +
               'Wij nemen zo snel mogelijk contact met je op om alles definitief te bevestigen. ' +
               'Controleer ook je inbox voor een bevestiging.</p>' +
               '<button class="wow-modal__btn wow-modal__success-close" id="wowSuccessClose" type="button">' +
               '<i class="fa-solid fa-check"></i> Sluiten</button>' +
               '</div></div>';
    }

    function buildModalHTML() {
        return '<div class="wow-modal-backdrop" id="wowModalBackdrop" role="dialog" aria-modal="true" aria-label="Aanmelden voor cursus">' +
               '<div class="wow-modal" id="wowModal">' +

               // Header
               '<div class="wow-modal__header">' +
               '<div class="wow-modal__header-top">' +
               '<div class="wow-modal__title"><i class="fa-solid fa-graduation-cap" style="margin-right:8px;"></i>Aanmelden bij WOW Theorie</div>' +
               '<button class="wow-modal__close" id="wowModalClose" aria-label="Sluiten" type="button"><i class="fa-solid fa-xmark"></i></button>' +
               '</div>' +
               '<div class="wow-modal__progress" id="wowModalProgress">' + buildProgressHTML() + '</div>' +
               '</div>' +

               // Body
               '<div class="wow-modal__body">' +
               buildStep1() + buildStep2() + buildStep3() + buildStep4() + buildStep5() + buildStep6() + buildStepSuccess() +
               '</div>' +

               // Footer
               '<div class="wow-modal__footer" id="wowModalFooter">' +
               '<button class="wow-modal__btn wow-modal__btn--back" id="wowBtnBack" type="button">' +
               '<i class="fa-solid fa-arrow-left"></i> Terug</button>' +
               '<span class="wow-modal__step-indicator" id="wowStepIndicator">Stap 1 van 6</span>' +
               '<button class="wow-modal__btn wow-modal__btn--next" id="wowBtnNext" type="button">' +
               'Volgende <i class="fa-solid fa-arrow-right"></i></button>' +
               '</div>' +

               '</div></div>';
    }

    /* ─── Calendar ───────────────────────────────────────── */
    function buildCalendar(year, month) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var minDate = new Date(today);
        minDate.setDate(minDate.getDate() + 7);

        var firstDay  = new Date(year, month, 1);
        var lastDay   = new Date(year, month + 1, 0);
        var monthName = MONTH_NAMES[month];

        // Dutch week: Mon=0 … Sun=6
        var startDow = firstDay.getDay();
        startDow = startDow === 0 ? 6 : startDow - 1;

        var h = '<div class="wow-modal__calendar">' +
                '<div class="wow-modal__calendar-header">' +
                monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year +
                '</div>' +
                '<div class="wow-modal__calendar-weekdays">' +
                DAY_NAMES.map(function(d){ return '<div class="wow-modal__calendar-weekday">' + d + '</div>'; }).join('') +
                '</div>' +
                '<div class="wow-modal__calendar-days">';

        for (var i = 0; i < startDow; i++) {
            h += '<div class="wow-modal__day is-empty"></div>';
        }

        for (var d = 1; d <= lastDay.getDate(); d++) {
            var thisDate = new Date(year, month, d);
            var dow      = thisDate.getDay(); // 0=Sun
            var isSun    = dow === 0;
            var isPast   = thisDate < minDate;
            var isToday  = thisDate.getTime() === today.getTime();
            var dateStr  = year + '-' + pad(month + 1) + '-' + pad(d);

            var cls = 'wow-modal__day';
            if (isSun) cls += ' is-sunday';
            if (isToday) cls += ' is-today';

            var disabled = (isPast || isSun) ? ' disabled' : '';

            h += '<button class="' + cls + '"' + disabled + ' data-date="' + dateStr + '" type="button">' + d + '</button>';
        }

        h += '</div></div>';
        return h;
    }

    function renderCalendars() {
        var container = document.getElementById('wowCalendars');
        if (!container) return;

        var today = new Date();
        var y = today.getFullYear();
        var m = today.getMonth();
        var nextM = m + 1;
        var nextY = y;
        if (nextM > 11) { nextM = 0; nextY = y + 1; }

        container.innerHTML = buildCalendar(y, m) + buildCalendar(nextY, nextM);

        container.querySelectorAll('.wow-modal__day:not([disabled])').forEach(function (btn) {
            btn.addEventListener('click', function () {
                container.querySelectorAll('.wow-modal__day').forEach(function (b) { b.classList.remove('is-selected'); });
                btn.classList.add('is-selected');
                state.datum = btn.dataset.date;
            });
        });

        // Restore selection
        if (state.datum) {
            var sel = container.querySelector('[data-date="' + state.datum + '"]');
            if (sel && !sel.disabled) sel.classList.add('is-selected');
        }
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    /* ─── Summary ─────────────────────────────────────────── */
    function renderSummary() {
        var container = document.getElementById('wowSummary');
        if (!container) return;

        var course  = COURSES.find(function(c){ return c.id === state.cursus; }) || {};
        var extras  = state.extras.map(function(id){
            var o = EXTRA_OPTIES.find(function(x){ return x.id === id; });
            return o ? o.label : id;
        }).join(', ') || 'Geen';

        var datum = '-';
        if (state.datum) {
            var d = new Date(state.datum + 'T12:00:00');
            datum = d.toLocaleDateString('nl-NL', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }

        var g = state.g;
        var adres = [g.straat ? g.straat + ' ' + g.huisnummer : g.huisnummer, g.postcode, g.stad].filter(Boolean).join(', ');
        var geboortedatum = '-';
        if (g.geboortedatum) {
            var gd = new Date(g.geboortedatum + 'T12:00:00');
            geboortedatum = gd.toLocaleDateString('nl-NL');
        }

        container.innerHTML =
            summarySection('Cursus & Locatie', [
                ['Cursustype',   '<i class="' + (course.icon || '') + '" style="margin-right:5px;color:#1e3a8a;"></i>' + (course.name || '-')],
                ['Provincie',    state.provincie || '-'],
                ['Datum',        datum],
                ['Extra opties', extras]
            ]) +
            summarySection('Persoonlijke Gegevens', [
                ['Naam',         g.voornaam + ' ' + g.achternaam],
                ['Geboortedatum',geboortedatum],
                ['E-mail',       g.email],
                ['Telefoon',     g.telefoon],
                ['Adres',        adres]
            ]);
    }

    function summarySection(title, rows) {
        var rowsHtml = rows.map(function(r){
            return '<div class="wow-modal__summary-row"><span class="wow-modal__summary-key">' + r[0] + '</span>' +
                   '<span class="wow-modal__summary-val">' + r[1] + '</span></div>';
        }).join('');
        return '<div class="wow-modal__summary-section">' +
               '<div class="wow-modal__summary-title">' + title + '</div>' +
               rowsHtml + '</div>';
    }

    /* ─── Progress ───────────────────────────────────────── */
    function updateProgress() {
        for (var i = 1; i <= 6; i++) {
            var stepEl = document.getElementById('wowPStep' + i);
            if (!stepEl) continue;
            stepEl.classList.remove('is-active', 'is-done');
            if (i < state.step) stepEl.classList.add('is-done');
            else if (i === state.step) stepEl.classList.add('is-active');

            var line = document.getElementById('wowPLine' + i);
            if (line) line.classList.toggle('is-done', i < state.step);
        }
        var ind = document.getElementById('wowStepIndicator');
        if (ind) ind.textContent = 'Stap ' + state.step + ' van 6';
    }

    /* ─── Show Step ──────────────────────────────────────── */
    function showStep(step) {
        for (var i = 1; i <= 6; i++) {
            var el = document.getElementById('wowStep' + i);
            if (el) el.classList.toggle('is-active', i === step);
        }
        var success = document.getElementById('wowStepSuccess');
        if (success) success.classList.remove('is-active');

        var footer = document.getElementById('wowModalFooter');
        var btnBack = document.getElementById('wowBtnBack');
        var btnNext = document.getElementById('wowBtnNext');

        if (footer) footer.style.display = 'flex';
        if (btnBack) btnBack.style.display = step === 1 ? 'none' : 'flex';

        if (btnNext) {
            if (step === 6) {
                btnNext.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Verzenden';
                btnNext.className = 'wow-modal__btn wow-modal__btn--submit';
            } else {
                btnNext.innerHTML = 'Volgende <i class="fa-solid fa-arrow-right"></i>';
                btnNext.className = 'wow-modal__btn wow-modal__btn--next';
            }
            btnNext.disabled = false;
        }

        state.step = step;
        updateProgress();

        if (step === 3) renderCalendars();
        if (step === 6) renderSummary();

        // Scroll modal body to top on step change
        var modal = document.getElementById('wowModal');
        if (modal) modal.scrollTop = 0;
    }

    /* ─── Validation ─────────────────────────────────────── */
    function validateStep(step) {
        if (step === 1) {
            if (!state.cursus) { shake(document.querySelector('.wow-modal__course-grid')); return false; }
            return true;
        }
        if (step === 2) {
            if (!state.provincie) { shake(document.querySelector('.wow-modal__province-grid')); return false; }
            return true;
        }
        if (step === 3) {
            if (!state.datum) { shake(document.getElementById('wowCalendars')); return false; }
            return true;
        }
        if (step === 4) return true; // optional
        if (step === 5) return validateGegevens();
        return true;
    }

    function validateGegevens() {
        var valid = true;

        function check(grpId, condition, msg) {
            var grp = document.getElementById(grpId);
            if (!grp) return;
            var errEl = grp.querySelector('.wow-modal__form-error');
            if (!condition) {
                grp.classList.add('has-error');
                if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
                valid = false;
            } else {
                grp.classList.remove('has-error');
                if (errEl) errEl.style.display = 'none';
            }
        }

        var g = state.g;
        check('grpVoornaam',    g.voornaam.trim().length >= 2,                        'Voornaam is verplicht (min. 2 tekens)');
        check('grpAchternaam',  g.achternaam.trim().length >= 2,                      'Achternaam is verplicht (min. 2 tekens)');
        check('grpGeboorte',    !!g.geboortedatum,                                   'Geboortedatum is verplicht');
        check('grpEmail',       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email),         'Voer een geldig e-mailadres in');
        check('grpTelefoon',    g.telefoon.replace(/\D/g,'').length >= 10,           'Voer een geldig telefoonnummer in (min. 10 cijfers)');
        check('grpPostcode',    /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(g.postcode),  'Geldige postcode verplicht (bijv. 1234 AB)');
        check('grpHuisnummer',  g.huisnummer.trim().length >= 1,                     'Huisnummer is verplicht');

        var akkoordErr = document.getElementById('akkoordError');
        if (!state.akkoord) {
            if (akkoordErr) akkoordErr.style.display = 'block';
            valid = false;
        } else {
            if (akkoordErr) akkoordErr.style.display = 'none';
        }

        var formErr = document.getElementById('wowFormError');
        if (!valid && formErr) { formErr.classList.add('is-visible'); }
        else if (valid && formErr) { formErr.classList.remove('is-visible'); }

        return valid;
    }

    /* ─── Postcode Lookup ────────────────────────────────── */
    var postcodeTimer = null;

    function triggerPostcodeLookup() {
        clearTimeout(postcodeTimer);
        postcodeTimer = setTimeout(function () {
            var pc = state.g.postcode.replace(/\s/g, '').toUpperCase();
            var nr = state.g.huisnummer.trim();
            if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc) || !nr) return;

            var status = document.getElementById('postcodeStatus');
            if (status) status.textContent = '⏳ Adres zoeken...';

            // PDOK Locatieserver - gratis NL overheids-API, geen sleutel nodig
            fetch('https://geodata.nationaalgeoregister.nl/locatieserver/v3/free?q=' +
                  encodeURIComponent(pc + ' ' + nr) + '&fq=type:adres&fl=straatnaam,woonplaatsnaam&rows=1')
            .then(function(r){ return r.json(); })
            .then(function(data){
                var docs = data && data.response && data.response.docs;
                if (docs && docs.length > 0) {
                    var doc = docs[0];
                    var strEl  = document.getElementById('inpStraat');
                    var stadEl = document.getElementById('inpStad');
                    if (strEl && doc.straatnaam) {
                        strEl.value = doc.straatnaam;
                        strEl.classList.add('is-autofilled');
                        state.g.straat = doc.straatnaam;
                    }
                    if (stadEl && doc.woonplaatsnaam) {
                        stadEl.value = doc.woonplaatsnaam;
                        stadEl.classList.add('is-autofilled');
                        state.g.stad = doc.woonplaatsnaam;
                    }
                    if (status) status.textContent = '✓ Adres gevonden';
                } else {
                    if (status) status.textContent = '⚠ Adres niet gevonden - vul straat en stad zelf in';
                }
            })
            .catch(function(){
                if (status) status.textContent = '';
            });
        }, 650);
    }

    /* ─── Submit ─────────────────────────────────────────── */
    function submitForm() {
        var btnNext = document.getElementById('wowBtnNext');
        if (btnNext) {
            btnNext.disabled = true;
            btnNext.innerHTML = '<span class="wow-modal__spinner"></span> Verzenden...';
        }

        var sendErr = document.getElementById('wowSendError');
        if (sendErr) sendErr.classList.remove('is-visible');

        var course  = COURSES.find(function(c){ return c.id === state.cursus; }) || {};
        var extras  = state.extras.map(function(id){
            var o = EXTRA_OPTIES.find(function(x){ return x.id === id; });
            return o ? o.label : id;
        }).join(', ') || 'Geen';

        var datum = state.datum || '';
        var datumFormatted = '-';
        if (datum) {
            var d = new Date(datum + 'T12:00:00');
            datumFormatted = d.toLocaleDateString('nl-NL', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }

        var g = state.g;
        var fd = new FormData();
        fd.append('cursus',       course.name || state.cursus);
        fd.append('provincie',    state.provincie || '');
        fd.append('datum',        datumFormatted);
        fd.append('datum_raw',    datum);
        fd.append('extras',       extras);
        fd.append('voornaam',     g.voornaam);
        fd.append('achternaam',   g.achternaam);
        fd.append('geboortedatum',g.geboortedatum);
        fd.append('email',        g.email);
        fd.append('telefoon',     g.telefoon);
        fd.append('postcode',     g.postcode);
        fd.append('huisnummer',   g.huisnummer);
        fd.append('straat',       g.straat);
        fd.append('stad',         g.stad);

        fetch('/php/register', {
            method: 'POST',
            body: fd,
            headers: { 'Accept': 'application/json' }
        })
        .then(function(r){ return r.json().then(function(data){ return { ok: r.ok, data: data }; }); })
        .then(function(res){
            if (res.ok && res.data.ok) {
                showSuccess();
            } else {
                var msg = (res.data && res.data.error) || 'Er is een fout opgetreden. Probeer het opnieuw.';
                if (sendErr) { sendErr.textContent = msg; sendErr.classList.add('is-visible'); }
                if (btnNext) { btnNext.disabled = false; btnNext.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Verzenden'; }
            }
        })
        .catch(function(){
            if (sendErr) {
                sendErr.textContent = 'Verbindingsfout. Controleer je internetverbinding en probeer opnieuw.';
                sendErr.classList.add('is-visible');
            }
            if (btnNext) { btnNext.disabled = false; btnNext.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Verzenden'; }
        });
    }

    /* ─── Success ────────────────────────────────────────── */
    function showSuccess() {
        for (var i = 1; i <= 6; i++) {
            var el = document.getElementById('wowStep' + i);
            if (el) el.classList.remove('is-active');
        }
        var success = document.getElementById('wowStepSuccess');
        if (success) success.classList.add('is-active');
        var footer = document.getElementById('wowModalFooter');
        if (footer) footer.style.display = 'none';
    }

    /* ─── Open / Close ───────────────────────────────────── */
    function openModal(preselect) {
        var backdrop = document.getElementById('wowModalBackdrop');
        if (!backdrop) return;

        state = makeState(preselect);

        // Reset UI
        backdrop.querySelectorAll('.wow-modal__course-card').forEach(function(el){ el.classList.remove('is-selected'); });
        backdrop.querySelectorAll('.wow-modal__province-btn').forEach(function(el){ el.classList.remove('is-selected'); });
        backdrop.querySelectorAll('.wow-modal__extra-option').forEach(function(el){ el.classList.remove('is-selected'); });
        backdrop.querySelectorAll('.wow-modal__form-group').forEach(function(el){ el.classList.remove('has-error'); });
        backdrop.querySelectorAll('.wow-modal__form-input').forEach(function(el){ el.value = ''; el.classList.remove('is-autofilled'); });
        var akk = document.getElementById('wowAkkoord');
        if (akk) { akk.classList.remove('is-checked'); akk.setAttribute('aria-checked','false'); }
        var postcodeStatus = document.getElementById('postcodeStatus');
        if (postcodeStatus) postcodeStatus.textContent = '';

        // Preselect course
        if (preselect) {
            var card = backdrop.querySelector('[data-course="' + preselect + '"]');
            if (card) card.classList.add('is-selected');
        }

        showStep(1);
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        var backdrop = document.getElementById('wowModalBackdrop');
        if (backdrop) backdrop.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    /* ─── Shake ──────────────────────────────────────────── */
    function shake(el) {
        if (!el) return;
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = 'wowShake 0.4s ease';
        setTimeout(function(){ el.style.animation = ''; }, 450);
    }

    /* ─── Init ───────────────────────────────────────────── */
    function init() {
        // Inject modal
        var div = document.createElement('div');
        div.innerHTML = buildModalHTML();
        document.body.appendChild(div.firstElementChild);

        // Close buttons
        document.getElementById('wowModalClose')?.addEventListener('click', closeModal);
        document.getElementById('wowSuccessClose')?.addEventListener('click', closeModal);
        document.getElementById('wowModalBackdrop')?.addEventListener('click', function(e){
            if (e.target === document.getElementById('wowModalBackdrop')) closeModal();
        });
        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

        // Course cards
        document.querySelectorAll('.wow-modal__course-card').forEach(function(card){
            card.addEventListener('click', function(){
                document.querySelectorAll('.wow-modal__course-card').forEach(function(c){ c.classList.remove('is-selected'); });
                card.classList.add('is-selected');
                state.cursus = card.dataset.course;
            });
            card.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); card.click(); } });
        });

        // Province buttons
        document.querySelectorAll('.wow-modal__province-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
                document.querySelectorAll('.wow-modal__province-btn').forEach(function(b){ b.classList.remove('is-selected'); });
                btn.classList.add('is-selected');
                state.provincie = btn.dataset.province;
            });
        });

        // Extra opties
        document.querySelectorAll('.wow-modal__extra-option').forEach(function(opt){
            opt.addEventListener('click', function(){
                var id = opt.dataset.extra;
                opt.classList.toggle('is-selected');
                var checked = opt.classList.contains('is-selected');
                opt.setAttribute('aria-checked', checked ? 'true' : 'false');
                if (checked) { if (state.extras.indexOf(id) === -1) state.extras.push(id); }
                else { state.extras = state.extras.filter(function(e){ return e !== id; }); }
            });
            opt.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); opt.click(); } });
        });

        // Form inputs
        var inputMap = {
            inpVoornaam:    'voornaam',
            inpAchternaam:  'achternaam',
            inpGeboorte:    'geboortedatum',
            inpEmail:       'email',
            inpTelefoon:    'telefoon',
            inpPostcode:    'postcode',
            inpHuisnummer:  'huisnummer',
            inpStraat:      'straat',
            inpStad:        'stad'
        };

        Object.keys(inputMap).forEach(function(id){
            var key = inputMap[id];
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function(){
                state.g[key] = el.value;
                // Clear autofill flag when user types
                if (id === 'inpStraat' || id === 'inpStad') el.classList.remove('is-autofilled');
                // Trigger postcode lookup
                if (id === 'inpPostcode' || id === 'inpHuisnummer') triggerPostcodeLookup();
            });
        });

        // Akkoord
        var akk = document.getElementById('wowAkkoord');
        if (akk) {
            akk.addEventListener('click', function(){
                state.akkoord = !state.akkoord;
                akk.classList.toggle('is-checked', state.akkoord);
                akk.setAttribute('aria-checked', state.akkoord ? 'true' : 'false');
                var err = document.getElementById('akkoordError');
                if (err && state.akkoord) err.style.display = 'none';
            });
            akk.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); akk.click(); } });
        }

        // Navigation
        document.getElementById('wowBtnNext')?.addEventListener('click', function(){
            if (state.step === 6) {
                submitForm();
            } else {
                if (validateStep(state.step)) showStep(state.step + 1);
            }
        });

        document.getElementById('wowBtnBack')?.addEventListener('click', function(){
            if (state.step > 1) showStep(state.step - 1);
        });

        // Trigger buttons: any element with class js-aanmeld-btn
        document.querySelectorAll('.js-aanmeld-btn').forEach(function(btn){
            btn.addEventListener('click', function(e){
                e.preventDefault();
                openModal(btn.dataset.cursus || null);
            });
        });
    }

    /* ─── Public API ─────────────────────────────────────── */
    window.wowOpenModal = openModal;
    window.wowCloseModal = closeModal;

    /* ─── Boot ───────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
