# Project Estimation - FUTURE
Date: 03-05-24

Version: 2.4


# Estimation approach
Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)
# Estimate by size
### 
|                                                                                                         | Estimate   |
| ------------------------------------------------------------------------------------------------------- | ---------- |
| NC =  Estimated number of classes to be developed                                                       | 25         |
| A = Estimated average size per class, in LOC                                                            | 240        |
| S = Estimated size of project, in LOC (= NC * A)                                                        | 6000       |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 600        |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 18.000     |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 3.75 weeks |

# Estimate by product decomposition
### 
| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document | 100ph                           |
| GUI prototype        | 80ph                            |
| design document      | 60ph                            |
| code                 | 600ph                           |
| unit tests           | 40ph                            |
| api tests            | 40ph                            |
| management documents | 50ph                            |

<!--Totale 970ph, 30 euro all'ora: 29.100 euro per l'intera progettazione e creazione del sito web -->

# Estimate by activity decomposition
### 
| Activity name                                          | Estimated effort (person hours) |
| ------------------------------------------------------ | ------------------------------- |
| Definizione dei requisiti                              | 30ph                            |
| Definizione iniziale dell'architettura del sistema     | 30ph                            |
| Stesura del documento dei requisiti                    | 100ph                           |
| Ispezione dei requisiti                                | 10ph                            |
| Progettazione definitiva dell'architettura del sistema | 20ph                            |
| Creazione del modello di interfaccia grafica           | 80ph                            |
| Ispezione della progettazione                          | 15ph                            |
| Stesura definitiva del design document                 | 60ph                            |
| Implementazione front-end                              | 240ph                           |
| Implementazione back-end                               | 360ph                           |
| Revisione del codice e correzione                      | 40ph                            |
| Attuazione test di unità e delle api                   | 80ph                            |
| Revisione finale dell'intero progetto                  | 40ph                            |
| Progettazione manageriale del sistema                  | 50ph                            |

<!--Totale 1155ph, 30 euro all'ora: 34.650 euro per l'intera progettazione e creazione del sito web -->

### Gantt Chart
![](imgV2/GranttChartV2.PNG)
# Summary

Le differenze derivano principalmente dal metodo di stima utilizzato. 

Infatti la stima per code size è una stima che tiene conto solo scrittura del codice, e perciò sarà meno accurata.

Al contrario la stima per decomposizione di prodotti e di attività sono progressivamente più specifiche, e includono la considerazione di più fattori che vanno ad incidere sul tempo complessivo necessario per progettare e realizzare l'intero progetto. 

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 600ph            | about 3.75 weeks   |
| estimate by product decomposition  | 970ph            | about 6 weeks      |
| estimate by activity decomposition | 1155ph           | about 7 weeks      |




