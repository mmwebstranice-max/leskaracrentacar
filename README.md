# M&I rent a car – web stranica

Statična stranica za najam vozila u Kutini. Kupac ispuni obrazac, a upit se otvara kao gotova poruka u WhatsAppu prema broju vlasnika.

Nema poslužitelja ni baze podataka: sve je HTML, CSS i JavaScript, a podaci stranice su u `data/site.js`.

## Struktura

```
index.html      stranica
style.css       izgled (svijetla i tamna tema)
app.js          logika: obrazac, WhatsApp poruka, popis vozila, uređivanje
data/site.js    PODACI: kontakt, broj za WhatsApp, vozila, cijene
slike/          fotografije vozila
favicon.png     ikona
logo.png        logo za tamno zaglavlje
logo-svijetla-podloga.png  originalni logo (za bijelu podlogu, dijeljenje na mrežama)
_headers        sigurnosna zaglavlja za Cloudflare Pages
```

## Objava na GitHub preko web sučelja (bez naredbi)

GitHub u pregledniku prima najviše 100 datoteka odjednom; ova mapa ima 47, pa ide u jednom koraku.

1. Raspakirajte zip na računalu.
2. Na GitHubu otvorite repozitorij → **Add file → Upload files**.
3. Otvorite raspakiranu mapu, označite **sve što je unutra** (Ctrl+A: mape `data`, `slike` i ostale datoteke) i povucite u prozor preglednika. Nemojte povući sam zip ni vanjsku mapu.
4. Pričekajte da se sve učita, pa kliknite **Commit changes**.

Napomena: datoteke koje počinju točkom (`.gitignore`) Windows ponekad ne pokaže; one nisu potrebne za rad stranice.

## Objava na Cloudflare Pages preko gita

1. Napravite novi repozitorij na GitHubu (npr. `mi-rent-a-car`) i u njega stavite sadržaj ove mape:
   ```bash
   cd mi-rent-a-car
   git init
   git add .
   git commit -m "Prva verzija stranice"
   git branch -M main
   git remote add origin https://github.com/VASE-KORISNICKO-IME/mi-rent-a-car.git
   git push -u origin main
   ```
2. U Cloudflareu: **Workers & Pages → Create → Pages → Connect to Git**, odaberite repozitorij.
3. Postavke builda:
   - Framework preset: **None**
   - Build command: *(prazno)*
   - Build output directory: **/** (korijen)
4. **Save and Deploy.** Dobit ćete adresu `nesto.pages.dev`.
5. Vlastita domena: u projektu **Custom domains → Set up a custom domain** (npr. `mi-rentacar.hr`).

Svaki `git push` na `main` automatski objavljuje novu verziju.

## Kako mijenjati vozila i podatke

**Način 1, kroz stranicu (bez programiranja):**
1. Otvorite stranicu s `#uredi` na kraju adrese, npr. `https://mi-rentacar.hr/#uredi`.
2. Pojavi se žuta traka. Kliknite **Uredi vozila i kontakt**: dodajte vozila, cijene i slike, promijenite kontakt.
3. Kliknite **Preuzmi site.js**.
4. Preuzetom datotekom zamijenite `data/site.js` u repozitoriju, pa commit i push (na GitHubu se može i preko web sučelja: *Add file → Upload files*).

Uređivanje preko `#uredi` je samo lokalni alat u vašem pregledniku: nitko ne može promijeniti stranicu bez pristupa vašem git repozitoriju.

**Način 2, ručno:** otvorite `data/site.js` i promijenite vrijednosti. Polje `"cijena": null` znači „Cijena na upit”. Polje `"primjer": true` prikazuje žutu oznaku *Primjer*; obrišite ga kad unesete stvarno vozilo.

**Slike:** fotografije vozila su u mapi `slike/katalog/`. Nove fotografije dodane kroz `#uredi` spremaju se unutar `site.js`. Za puno vozila bolje je slike staviti u mapu `slike/` i upisati `"slika": "slike/ime.jpg"`.

**Galerija:** sekcija s galerijom je isključena. Uključuje se dodavanjem stavki u `data/site.js` pod `"galerija"` (polja `src` i `opis`), npr. `{"src": "slike/foto.jpg", "opis": "Opis slike"}`.

## Lokalni pregled

Dovoljno je dvaput kliknuti `index.html`, ili pokrenuti mali poslužitelj:
```bash
python3 -m http.server 8000
```
pa otvoriti http://localhost:8000

## Sigurnost

- `_headers` uključuje CSP (dopušta samo vlastite skripte i Google Fonts), HSTS, zabranu prikaza u tuđim okvirima i ostala zaglavlja.
- Upiti kupaca se nigdje ne spremaju: idu izravno u WhatsApp.
- Sav tekst iz podataka prikazuje se kao običan tekst (nema ubacivanja HTML-a ni skripti).
- Na GitHubu uključite 2FA, a repozitorij može biti privatan (Cloudflare Pages radi i s privatnim repozitorijima).

## Slike vozila

Svako vozilo ima bočnu fotografiju (prikazuje se prva) i fotografiju sprijeda s tablicom „MI RENT A CAR” (druga), na svijetloj podlozi. Gotove slike su u `slike/katalog/` (`ime.jpg` sprijeda, `ime-2.jpg` bočno; 1200 × 750 px, omjer 16:10 kao kartice). U `data/site.js` polje `"slika"` je prva (bočna), a `"slika2"` druga slika (sprijeda) (na kartici se lista strelicama). Prikolice imaju samo jednu sliku. Polje `"ilustrativna": true` prikazuje napomenu „Fotografija je ilustrativna”; obrišite ga kad stavite stvarnu fotografiju svog vozila.

Stare, nekorištene slike su uklonjene da repozitorij ima manje datoteka (ukupno 47).

## Naslovna slika

U naslovnom dijelu je logo `slike/naslovna-logo.webp`, prilagođen za tamnu pozadinu (crni dijelovi su bijeli, pozadina prozirna). Mijenja se zamjenom te datoteke. Rezervna kopija u PNG-u je `slike/naslovna-logo.png`.

## Vrste najma

Stranica ima sekcije za **kratkoročni najam**, **dugoročni najam** (od 30 dana do 36 mjeseci), **poslovni najam** (obrazac za tvrtke) i **vozilo po želji** (ako vozila nema u ponudi). Obrazac u zaglavlju ima prekidač Kratkoročni / Dugoročni. Svi upiti idu u WhatsApp.

Popis „Uključeno u mjesečnu cijenu” i tablica „Dugoročni najam ili leasing?” uređuju se u `data/site.js` pod `"dugorocni"` (`"ukljuceno"` i `"usporedba"`). Provjerite da popis odgovara onome što stvarno nudite; ako je popis prazan, blok se ne prikazuje.

## Detalji vozila

Klik na vozilo otvara prozor sa slikama, specifikacijama i gumbima Rezerviraj, Pitaj na WhatsApp i Dugoročni najam. Svako vozilo ima svoju adresu, npr. `/#vozilo-v03`, pa se može poslati kupcu. Specifikacije se uređuju u `data/site.js` pod `"specifikacije"` (parovi `["Naziv", "vrijednost"]`) ili kroz `#uredi` (jedna po retku, `Naziv: vrijednost`). Upisane mjere su okvirne tvorničke vrijednosti modela; zamijenite ih podacima vaših vozila (motor, gorivo, godište).

## Slogani

Moto „Vozila koja pokreću vaše planove.” i crvena traka sa sloganima preuzeti su s Instagram profila. Mijenjaju se u `data/site.js` pod `"moto"` i `"slogani"`.
