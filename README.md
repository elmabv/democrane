# Elma Democrane POC Inleiding

Dit is de software nodig voor de Elma Demonstration Crane. Dit is een 1e versie welke dienst doet als Proof of Concept.

## Opstarten vanuit Elma

Om mee te werken aan de demo crane voer je de volgende acties uit

1. Maak een GitHub account (als je dat nog niet hebt). Wij adviseren een account aan te maken met je persoonlijke privé email adres. Je GitHub account is een persoonlijk account gekoppeld aan jou als persoon. Na het beindigen van je dienstverband bij Elma kan je Elma email adres onbereikbaar zijn.
1. Geef je GitHub accountnaam door aan de beheerder bij Elma. Deze zal je toevoegen als **Member** aan **People** binnen https://github.com/elmabv
1. Installeer GitHub Desktop [desktop.github.com](https://desktop.github.com) op je PC van Elma. Heb je niet genoeg rechten vraag dan ondersteuning aan bij Elma IT.
1. Voeg de repository `elmabv/democrane` toe op je HDD van je PC. Wij adviseren deze te plaatsen in de folder `C:\aliconnect\public\elmabv\democrane`
1. Installeer de Code Editor `Visual Studio Code` van [code.visualstudio.com](https://code.visualstudio.com).
1. Open Folder `C:\aliconnect\public\elmabv\democrane` in je Code Editor.
1. Installeer TIA Portal v18 op je PC
1. Ga naar project `C:\Users\...\Elma BV\Studenten - Documenten\Demo kraan\ElmaDemoKraan_MQTT`
1. Stel de folder in met de optie `Altijd behuden op dit apparaat`


## Container Management System Software

![CMS visualisatie](/democrane/images/democrane-cms1.png)

De demo crane opstelling bestaat uit een Container Management System (CMS) voor het beheer van de containers binnen het werkgebied van de kraan. Deze web webapplicatie draait in de cloud. De CMS applicatie wordt [hier](cms/index.html) gestart.

## Container Management System App

Voor het plaatsen en ophalen van een container wordt gebruik gemaakt van een webapp. De webapp wordt [hier](cms/app/index.html) gestart.

## MQTT LAN Server

Binnen het industrial LAN van de kraan bevindt zich een MQTT server die de communicatie verzorgt tussen de PLC en dfe message broker. Op deze server is nodejs geinstalleerd en de [MQTT server applicatie](https://github.com/elmabv/democrane/tree/main/mqtt-server)

## MQTT Message Broker

Binnen het industrial LAN van de kraan bevindt zich een message broker. De PC met de message broker en/of MQTT LAN Server is via UTP verbonden met het LAN en via Wifi met het WAN. Deze Message Broker verzorgt de communicatie tussen het CMS in de cloud/WAN en de PLC in het LAN. De broker wordt gestart door het opstarten van het bestand `democrane/local-server/local-server.html`.

## PLC Crane Software

De PLC software is opgebouwd met TIA en draait op een Siemens 1500.

# MQTT topics:

## Van PLC naar Server

- `elmabv/democrane/plc/axisx/pos`: Current position Axis X (left/right)
- `elmabv/democrane/plc/axisy/pos`: Current position Axis Y (up/down)
- `elmabv/democrane/plc/axisz/pos`: Current position Axis Z (front/back)
- `elmabv/democrane/plc/state`: State of crane (0:none|1:idle|2:running|3:paused|4:stopped|...)

## Van Server naar PLC

- `elmabv/democrane/server/state`: Active state (0:none|1:init|2:run)
- `elmabv/democrane/server/plc/axisx/targetpos`: Target position Axis X
- `elmabv/democrane/server/plc/axisy/targetpos`: Target position Axis Y
- `elmabv/democrane/server/plc/axisz/targetpos`: Target position Axis Z
- `elmabv/democrane/server/plc/command`: Command to crane (0:none|1:idle|2:running|3:paused|4:pausing|...)

# PLC Software

# State model

![ISA-88 State Model Equipment Phase](https://aliconnect.nl/assets/image/isa88-state-model-unit.png)

## States

1. Idle
1. Running
1. Complete
1. Stopped
1. Aborted
1. Held
1. Paused/Suspended

1. Starting
1. Completing
1. Stopping
1. Clearing
1. Aborting
1. Holding
1. Unholding
1. Pausing/Suspending
1. Unpausing/Unsuspending

## Commands

1. Start
1. Complete
1. Reset
1. Stop
1. Abort
1. Hold
1. Unhold
1. Pause/Suspend
1. Unpause/Unsuspend

# Init


    1. `3461241` = 1



1. CMS
    1. `elmabv/democrane/state` = 1    
    1. `elmabv/democrane/plc/command` = 0
    1. `elmabv/democrane/state` = 2

# Flow

1. PLC > `elmabv/democrane/plc/mode` = 1: Auto

1. PLC > `elmabv/democrane/plc/state` = 1: Idle

1. Naar pick positie
    1. CMS > `elmabv/democrane/server/plc/axisx/targetpos` = 200
    1. CMS > `elmabv/democrane/server/plc/axisy/targetpos` = 750
    1. CMS > `elmabv/democrane/server/plc/axisz/targetpos` = 80
    1. CMS > `elmabv/democrane/server/plc/command` = 1 (Start)
    1. PLC > `elmabv/democrane/plc/state` = 2: Running
    1. PLC > Update position / second
        1. PLC > `elmabv/democrane/plc/axisx/pos`: Current position Axis X (front/back)
        1. PLC > `elmabv/democrane/plc/axisy/pos`: Current position Axis Y (left/right)
        1. PLC > `elmabv/democrane/plc/axisz/pos`: Current position Axis Z (up/down)
    1. PLC > `elmabv/democrane/plc/state` = 3: Complete

1. Pak container
    1. CMS > `elmabv/democrane/server/plc/gripper` = 1
    1. CMS > `elmabv/democrane/server/plc/command` = 1 (Start)
    1. PLC > `elmabv/democrane/plc/state` = 2: Running
    1. PLC > `elmabv/democrane/plc/state` = 3: Complete

1. Naar place positie
    1. CMS > `elmabv/democrane/server/plc/axisx/targetpos` = 500
    1. CMS > `elmabv/democrane/server/plc/axisy/targetpos` = 200
    1. CMS > `elmabv/democrane/server/plc/axisz/targetpos` = 80
    1. CMS > `elmabv/democrane/server/plc/command` = 1 (Start)
    1. PLC > `elmabv/democrane/plc/state` = 2: Running
    1. PLC > Update position / second
        1. PLC > `elmabv/democrane/plc/axisx/pos`: Current position Axis X (front/back)
        1. PLC > `elmabv/democrane/plc/axisy/pos`: Current position Axis Y (left/right)
        1. PLC > `elmabv/democrane/plc/axisz/pos`: Current position Axis Z (up/down)
    1. PLC > `elmabv/democrane/plc/state` = 3: Complete

1. Plaats container
    1. CMS > `elmabv/democrane/server/plc/gripper` = 0
    1. CMS > `elmabv/democrane/server/plc/command` = 1 (Start)
    1. PLC > `elmabv/democrane/plc/state` = 2: Running
    1. PLC > `elmabv/democrane/plc/state` = 3: Complete
