


# CMS

- [Democrane CMS](https://elmabv.aliconnect.nl/democrane/cms/index.html)
- [Democrane CMS App](https://elmabv.aliconnect.nl/democrane/cms/app/index.html)

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

