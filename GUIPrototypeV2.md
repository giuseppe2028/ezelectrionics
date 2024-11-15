# Graphical User Interface Prototype - FUTURE
Authors: Giuseppe Barone, Christian Galipò, Lorenzo Cuccu, Giulio Lettieri

Date: 01-05-2024

Version: 2.3

Come riportato all'interno del documento "[RequirementsDocumentV2](./RequirementsDocumentV2.md)", il software si compone di tre profili:
- Un profilo Customer
- Un profilo Manager
- Un profilo Admin

## Pagine Customer
In questa sezione si analizzano le pagine del customer:
### Login [UC1](./RequirementsDocumentV2.md#use-case-1-uc1)
Il login del customer si effettua inserendo l'username e la password.
Nel caso in cui il customer non si fosse ancora registrato, può farlo attraverso il textButton "Registrati", il quale avvia il caso d'uso "Registrazione" [UC3](./RequirementsDocumentV2.md#use-case-3-uc3).

![LoginManager.png](ImgGUI%2FV2%2FManager%2FLoginManager.png)

### Registrazione [UC3](./RequirementsDocumentV2.md#use-case-3-uc3)
La schermata registrazione permette al customer di inserire dati quali:
- Username
- Nome
- Cognome
- Password

![Registrazione.png](ImgGUI%2FV2%2FCustomer%2FRegistrazione.png)

### Visualizza Informazioni Customer [UC4](./RequirementsDocumentV2.md#use-case-4-uc4)
In questa sezione il customer ha la possibilità di visualizzare le proprie informazioni personali.

![VisualizzaProfilo.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaProfilo.png)

### Modifica Account [UC5](./RequirementsDocumentV2.md#use-case-5-uc5)
In tale schermata il customer può modificare le proprie informazioni personali, come: 
- Nome
- Cognome
- Username
- Email
- Numero di telefono
- Indirizzo

![ModificaAccoiunt.png](ImgGUI%2FV2%2FCustomer%2FModificaAccoiunt.png)


### Modifica Password [UC9](./RequirementsDocumentV2.md#use-case-9-uc9)
In questa schermata il customer ha la possibilità di modificare la propria password

![ModificaPAssword.png](ImgGUI%2FV2%2FCustomer%2FModificaPAssword.png)

### Recupera Password [UC10](./RequirementsDocumentV2.md#use-case-10-uc10)

In questa schermata il customer ha la possibilità di recuperare la propria password

![RecuperaPasswod.png](ImgGUI%2FV2%2FManager%2FRecuperaPasswod.png)

### Visualizza metodo di pagamento [UC6](./RequirementsDocumentV2.md#use-case-6-uc6)

Questa schermata permette al customer di visualizzare il proprio metodo di pagamento

![VisualizzaMetodoDiPagamento.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaMetodoDiPagamento.png)

### Aggiungi carta di credito [UC7](./RequirementsDocumentV2.md#use-case-7-uc7)

In questa schermata il customer ha la possibilità di aggiungere la propria carta di credito


![AggiungiCarta.png](ImgGUI%2FV2%2FCustomer%2FAggiungiCarta.png)

### Rimuovi carta di credito [UC8](./RequirementsDocumentV2.md#use-case-8-uc8)

In questa schermata il customer ha la possibilità di rimuovere la propria carta di credito 

![EliminaCarta.png](ImgGUI%2FV2%2FCustomer%2FEliminaCarta.png)

### Visualizza Prodotti Customer [UC11](./RequirementsDocumentV2.md#use-case-11-uc11)
In tale pagina è possibile, visualizzare tutti i prodotti oppure filtrarli per:
- Modello
- Codice
- Categoria

Inoltre, il customer attraverso il menù posto in alto può:
- Visualizzare il proprio carrello [UC18](./RequirementsDocumentV2.md#use-case-18-uc18)
- Visualizzare le proprie informazioni Utente [UC4](./RequirementsDocumentV2.md#use-case-4-uc4)
- Effettuare il logout [UC2](./RequirementsDocumentV2.md#use-case-2-uc2)

Inizialmente il software restituisce un messaggio di avvertimenti di selezione di un filtro per visualizzare i prodotti.

![VisualizzaTuttiIProdottiErr.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaTuttiIProdottiErr.png)

Ecco il caso in cui il customer seleziona dei filtri:

Visualizza Tutti i prodotti:

![VisualizzaTuttiIprodottiNoErr.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaTuttiIprodottiNoErr.png)

Visualizza Tutti i prodotti per Categoria:

![VisualizzaTuttiIprodottiCategoria.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaTuttiIprodottiCategoria.png)

Visualizza tutti i prodotti per Modello:

![VisualizzaTuttiIprodottiModello.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaTuttiIprodottiModello.png)

### Visualizza Carrello [UC18](./RequirementsDocumentV2.md#use-case-18-uc18)
In questa schermata è possibile visualizzare il proprio carrello; visualizzare il totale, ed eliminare un determinato prodotto attraverso il tasto
"Rimuovi" [UC21](./RequirementsDocumentV2.md#use-case-21-uc21).

È possibile, inoltre, visualizzare lo storico degli ordini precedenti attraverso il tasto "Visualizza Cronologia" [UC20](./RequirementsDocumentV2.md#use-case-20-uc20), svuotare il carrello attraverso il tasto "svuota carrello" [UC11](./RequirementsDocumentV2.md#use-case-11-uc11) oppure
procedere al "paga carrello" [UC22](./RequirementsDocumentV2.md#use-case-22-uc22)

![VisualizzaCarrello.png](ImgGUI%2FV2%2FCustomer%2FVisualizzaCarrello.png)

### Visualizza Cronologia ordini [UC20](./RequirementsDocumentV2.md#use-case-20-uc20)
In questa schermata il customer può visualizzare la propria cronologia degli ordini:

![CronologiaOrdini.png](ImgGUI%2FV2%2FCustomer%2FCronologiaOrdini.png)

### Paga Carrello [UC22](./RequirementsDocumentV2.md#use-case-22-uc22)
Questa pagina permette al customer di pagare un carrello. È possibile selezionare sia il metodo di pagamento e sia la modalità di spedizione

![Pagamento.png](ImgGUI%2FV2%2FCustomer%2FPagamento.png)



## Pagine Manager
In questa sezione si analizzano tutte le pagine relative al Manager.

### Login [UC1](./RequirementsDocumentV2.md#use-case-1-uc1)
Il login del manager si effettua inserendo l'username e la password.
Nel caso in cui il manager non si fosse ancora registrato, può farlo attraverso il textButton "Registrati", il quale avvia il caso d'uso "Registrazione" [UC3](./RequirementsDocumentV2.md#use-case-3-uc3).

![LoginManager.png](ImgGUI%2FV2%2FManager%2FLoginManager.png)

### Registrazione [UC3](./RequirementsDocumentV2.md#use-case-3-uc3)
La schermata registrazione permette al Manager di inserire dati quali:
- Username
- Nome
- Cognome
- Password
- Email
- Immagine del profilo personale
- Codice Manager

![RegistrazioneManager.png](ImgGUI%2FV2%2FManager%2FRegistrazioneManager.png)

### Visualizza Informazioni Utente [UC4](./RequirementsDocumentV2.md#use-case-4-uc4)
In questa sezione il Manager ha la possibilità di visualizzare le proprie informazioni personali.

![VisualizzaProfilo.png](ImgGUI%2FV2%2FManager%2FVisualizzaProfilo.png)

### Modifica Account [UC5](./RequirementsDocumentV2.md#use-case-5-uc5)
In tale schermata il Manager può modificare le proprie informazioni personali, come:
- Nome
- Cognome
- Username
- Email
- Numero di telefono
- Indirizzo
- Immagine del profilo personale

![ModificaAccount.png](ImgGUI%2FV2%2FManager%2FModificaAccount.png)

### Modifica Password [UC9](./RequirementsDocumentV2.md#use-case-9-uc9)
In questa schermata il customer ha la possibilità di modificare la propria password

![ModificaPassword.png](ImgGUI%2FV2%2FManager%2FModificaPassword.png)

### Recupera Password [UC10](./RequirementsDocumentV2.md#use-case-10-uc10)

In questa schermata il customer ha la possibilità di recuperare la propria password

![RecuperaPasswod.png](ImgGUI%2FV2%2FManager%2FRecuperaPasswod.png)

### Visualizza Prodotti [UC11](./RequirementsDocumentV2.md#use-case-11-uc11)
In questa pagina, è possibile visualizzare i prodotti presenti all'interno del sistema.

Inizialmente il software restituisce un messaggio di avvertimento di selezione un filtro per visualizzare i prodotti.

![VisualizzaProdottiNoSel.png](ImgGUI%2FV2%2FManager%2FVisualizzaProdottiNoSel.png)

Il sistema prevede un meccanismo di filtraggio dinamico, 
nel quale è possibile, attraverso dei radio button, filtrare i prodotti.

- Se il manager seleziona la voce "Tutti i prodotti" allora il sistema provvederà a fornire tutti i prodotti del sistema.

![VisualizzaTuttiIProdotti.png](ImgGUI%2FV2%2FManager%2FVisualizzaTuttiIProdotti.png)

- Se l'utente seleziona la voce "modello" allora il sistema mostrerà inizialmente un messaggio di richiesta di inserimento del modello all'interno della barra di ricerca. Una volta inserito correttamente il dato il sistema mostrerà i prodotti relativi al modello selezionato

![VisualizzaProdotti(Modello).png](ImgGUI%2FV2%2FManager%2FVisualizzaProdotti%28Modello%29.png)

- Se l'utente seleziona la voce "categoria" allora il sistema mette a disposizione un drop menu button, con il quale si avrà la possibilità di selezionare la categoria desiderata.

![VisualizzaProdottiCategoria.png](ImgGUI%2FV2%2FManager%2FVisualizzaProdottiCategoria.png)

### Visualizza Informazioni prodotto [UC12](./RequirementsDocumentV2.md#use-case-12-uc12)
In questa schermata il manager può visionare nel dettaglio le informazioni di un prodotto:

![VisualizzaInformazioniProdotto.png](ImgGUI%2FV2%2FManager%2FVisualizzaInformazioniProdotto.png)

### Cancella Prodotto [UC17](./RequirementsDocumentV2.md#use-case-17-uc17)
In questa schermata il manager inserisce il modello di cui vuole eliminare prodotti, e seleziona attraverso un contatore il numero di copie da eliminare

![CancellaProdotto.png](ImgGUI%2FV2%2FManager%2FCancellaProdotto.png)

### Modifica Prodotto [UC16](./RequirementsDocumentV2.md#use-case-16-uc16)
In questa schermata il manager può modificare il proprio prodotto registrata

![ModificaProdotto.png](ImgGUI%2FV2%2FManager%2FModificaProdotto.png)

### Registra nuovo Prodotto [UC14](./RequirementsDocumentV2.md#use-case-14-uc14)
In questa schermata il manager compila i seguenti campi: 
- Modello
- Prezzo di vendita 
- Dettagli 
- Categoria
- Immagine del prodotto 

Tale schermata è utilizzata per poter registrare un determinato modello all'interno del sistema.

![RegistraNuovoProdotto.png](ImgGUI%2FV2%2FManager%2FRegistraNuovoProdotto.png)

### Visualizza prodotti venduti [UC13](./RequirementsDocumentV2.md#use-case-13-uc13)
In questa schermata il manager ha la possibilità di visualizzare i propri prodotti venduti:

![VisualizzaProdottiVenduti.png](ImgGUI%2FV2%2FManager%2FVisualizzaProdottiVenduti.png)

### Aggiungi nuovo prodotto [UC15](./RequirementsDocumentV2.md#use-case-15-uc15)
In questa schermata il manager ha la possibilità aggiungere più copie di un prodotto presente nel database. Nel caso il prodotto non fosse registrato 
allora compare un messaggio per registrare il prodotto:

![AggiungiNuovoProdotto.png](ImgGUI%2FV2%2FManager%2FAggiungiNuovoProdotto.png)

![AggiungiProdottoNoErr.png](ImgGUI%2FV2%2FManager%2FAggiungiProdottoNoErr.png)

## Pagine Admin

Questa sezione è dedicata a tutte le pagine dell'admin:

### Pagina iniziale

Questa pagina consente all'admin di raggiungere tutte le funzionalità implementate:

![SchermataIniziale.png](ImgGUI%2FV2%2FAdmin%2FSchermataIniziale.png)

### Visualizza Utenti [UC24](./RequirementsDocumentV2.md#use-case-24-uc24)
Questa schermata permette all'admin di:
- Visualizzare tutti gli utenti [UC24](./RequirementsDocumentV2.md#use-case-24-uc24) e filtrarli per ruolo e per username
- Eliminare tutti gli utenti [UC25](./RequirementsDocumentV2.md#use-case-25-uc25)
- Eliminare un singolo utente

![VisualizzaUtenti.png](ImgGUI%2FV2%2FAdmin%2FVisualizzaUtenti.png)

### Rimuovi Manager [UC29](./RequirementsDocumentV2.md#use-case-29-uc29)

Questa schermata permette all'admin di eliminare un manager dal sistema, fornendo in input il codice manager

![RimuoviManager.png](ImgGUI%2FV2%2FAdmin%2FRimuoviManager.png)

### Inserisci Manager [UC28](./RequirementsDocumentV2.md#use-case-28-uc28)
Questa schermata permette all'admin di aggiungere un manager al sistema, fornendo in input il codice manager, e il nome del negozio.

![InserisciCodiceManager.png](ImgGUI%2FV2%2FAdmin%2FInserisciCodiceManager.png)

### Modifica Informazioni Negozio [UC30](./RequirementsDocumentV2.md#use-case-30-uc30)
Questa schermata permette all'admin di modificare le informazioni del negozio fornendo in input il nome del negozio: 

![ModificaInformazioniNegozio.png](ImgGUI%2FV2%2FAdmin%2FModificaInformazioniNegozio.png)

### Aggiungi Negozio [UC31](./RequirementsDocumentV2.md#use-case-31-uc31)
Questa schermata permette all'admin di aggiungere un negozio al sistema, fornendo in input il nome del negozio e la via.

![AggiungiNegozio.png](ImgGUI%2FV2%2FAdmin%2FAggiungiNegozio.png)

### Rimuovi Negozio [UC32](./RequirementsDocumentV2.md#use-case-32-uc32)
Questa schermata permette all'admin di rimuovere un negozio dal sistema, fornendo in input il nome del negozio.

![RimuoviNegozio.png](ImgGUI%2FV2%2FAdmin%2FRimuoviNegozio.png)
