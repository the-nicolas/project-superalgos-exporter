import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as dt from 'directory-tree';
import * as Xbytes from 'xbytes';
import * as Si from 'systeminformation';
import * as Shell from 'shelljs';
import { ConfigService } from '@nestjs/config';

export interface SATradingPosition {
  serial: number;
  uuid: string;
  opening?: any;
  closing?: any;
}

export interface SAAggrTradingPosition {
  serial: number;
  uuid: string;
  beginDate?: string;
  endDate?: string;
  beginRate?: number;
  endRate?: number;
}

@Injectable()
export class TradingSessionService {
  private positions: SATradingPosition[] = [];

  // Config
  public sysSAroot: string = '';

  constructor(private configService: ConfigService) {
    this.sysSAroot = configService.get<string>('sys.saRoot');
  }

  private async readJsonFile(file: string) {
    const data = await fs.promises.readFile(file);

    // Converting to JSON
    return JSON.parse(data.toString());
  }

  getAll(): SATradingPosition[] {
    return this.positions;
  }

  async getProjects() {
    let ret = dt(path.join(this.sysSAroot, 'Project'));
    return _.flatMap(ret.children, (x) => x.name);
    //return ret;
  }

  reset() {
    this.positions = [];
  }

  private assignPosition(raw: (string | number)[]) {
    // console.log('RAW', raw);
    const pos = _.findIndex(this.positions, {
      serial: <number>raw[0],
      uuid: <string>raw[1],
    });
    if (pos == -1) {
      // new
      const node = <SATradingPosition>{
        serial: <number>raw[0],
        uuid: <string>raw[1],
      };

      if (raw[5] === 'Closed') {
        node.closing = raw;
        if (raw[4] != 'No Exit') {
          node.opening = raw;
        }
      } else {
        node.opening = raw;
      }
      // append
      this.positions.push(node);
    } else {
      // update
      if (raw[5] === 'Closed') {
        this.positions[pos].closing = raw;
        if (raw[4] != 'No Exit') {
          this.positions[pos].opening = raw;
        }
      } else {
        this.positions[pos].opening = raw;
      }
    }
    return pos;
  }

  async getProjectExchanges(project: string) {
    let ret = dt(
      path.join(
        ...[
          this.sysSAroot,
          'Project',
          project,
          'Trading-Mine',
          'Masters',
          'Low-Frequency',
        ],
      ),
    );
    return _.flatMap(ret.children, (x) => x.name);
    //return ret;
  }

  async getExchangePairs(project: string, exchange: string) {
    let ret = dt(
      path.join(
        ...[
          this.sysSAroot,
          'Project',
          project,
          'Trading-Mine',
          'Masters',
          'Low-Frequency',
          exchange,
        ],
      ),
    );
    return _.flatMap(ret.children, (x) => x.name);
  }

  async getSessions(project: string, exchange: string, exchangePair: string) {
    let ret = dt(
      path.join(
        ...[
          this.sysSAroot,
          'Project',
          project,
          'Trading-Mine',
          'Masters',
          'Low-Frequency',
          exchange,
          exchangePair,
          'Output',
        ],
      ),
    );
    return _.flatMap(ret.children, (x) => x.name);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async loadSession(
    project: string,
    exchange: string,
    exchangePair: string,
    session: string,
  ) {
    const sessionRoot = path.join(
      ...[
        this.sysSAroot,
        'Project',
        project,
        'Trading-Mine',
        'Masters',
        'Low-Frequency',
        exchange,
        exchangePair,
        'Output',
        session,
        'Position-Objects',
        'Multi-Time-Frame-Daily',
      ],
    );

    let dateRange = {};

    try {
      dateRange = await this.readJsonFile(
        path.join(sessionRoot, 'Data.Range.json'),
      );
    } catch (err) {
      throw new Error('Error reading Data.Range.json');
    }

    const timeFrames = _.filter(dt(sessionRoot).children, {
      type: 'directory',
    });

    if (timeFrames.length > 1) {
      throw new Error('More than one time frame');
    }
    const tf = timeFrames.pop().name;
    const posFiles = Shell.find(path.join(sessionRoot, tf, '/**/**/Data.json'));

    await Promise.all(
      posFiles.map(async (tl) => {
        const data = await this.readJsonFile(tl);
        await Promise.all(
          data.map(async (tp) => {
            this.assignPosition(tp);
          }),
        );
      }),
    );

    //await this.sleep(1000);
    return this.positions;
  }

  aggrPos(pos: SATradingPosition): SAAggrTradingPosition {
    // console.log(pos);
    const ret = <SAAggrTradingPosition>{
      uuid: pos.uuid,
      serial: pos.serial,
    };
    if (pos.opening) {
      ret.beginDate = new Date(pos.opening[2]).toISOString();
      ret.beginRate = pos.opening[6];
    }
    if (pos.closing) {
      ret.endDate = new Date(pos.closing[3]).toISOString();
      ret.endRate = pos.closing[7];
    }
    return ret;
  }

  getPineScript(body: string) {
    const scr = `// This source code is subject to the terms of the Mozilla Public License 2.0 at https://mozilla.org/MPL/2.0/
// © NeoButane

//@version=4
study(title = "My TH-SA", shorttitle = "MY-TH-SA", overlay=true) // , 

colBGP1 = input(title="+BG Color 1", type=input.color, defval=color.new(color.green, 80))
colBGP2 = input(title="+BG Color 2", type=input.color, defval=color.new(color.green, 70))
offsetBGP2 = input(title="+BG 2 %", type=input.float, defval=1.2)
colBGP3 = input(title="+BG Color 3", type=input.color, defval=color.new(color.green, 60))
offsetBGP3 = input(title="+BG 3 %", type=input.float, defval=4.0)
colBGP4 = input(title="+BG Color 4", type=input.color, defval=color.new(color.green, 50))
offsetBGP4 = input(title="+BG 4 %", type=input.float, defval=1.00)

colBGN1 = input(title="-BG Color 1", type=input.color, defval=color.new(color.red, 80))
colBGN2 = input(title="-BG Color 2", type=input.color, defval=color.new(color.red, 70))
offsetBGN2 = input(title="-BG 2 %", type=input.float, defval=0.3)
colBGN3 = input(title="-BG Color 3", type=input.color, defval=color.new(color.red, 60))
offsetBGN3 = input(title="-BG 3 %", type=input.float, defval=0.5)
colBGN4 = input(title="-BG Color 4", type=input.color, defval=color.new(color.red, 50))
offsetBGN4 = input(title="+BG 4 %", type=input.float, defval=1.0)


// CONFIG
maxSerial = 1000


// global persistent vars (serial used as index)
var arrBeginRate = array.new_float(maxSerial)
var arrEndRate = array.new_float(maxSerial)
var arrBeginDate = array.new_int(maxSerial)
var arrEndDate = array.new_int(maxSerial)
// calced
var arrPercentRate = array.new_float(maxSerial)
// runtime global
var runSerials = array.new_int(0)
var runLastSerial = 0
// act runtime
startSerial = 0
stopSerial = 0
barOpenTime = time("", "")
barCloseTime = time_close("", "")

getBgColor() =>
    _c = color.white
    _percArr = array.new_float(0)

    if array.size(runSerials) > 0
        for i = 0 to array.size(runSerials) - 1
            serial = array.get(runSerials, i)
            perc = array.get(arrPercentRate, serial)
            array.push(_percArr, perc)
    
    _min = array.min(_percArr)
    _max = array.max(_percArr)
    
    if (_max > 0 and _min > 0)
        // P/max is leading
        _c := colBGP1
        if _max >= offsetBGP2
            _c := colBGP2
        if _max >= offsetBGP3
            _c := colBGP3
        if _max >= offsetBGP4
            _c := colBGP4
    else if array.size(runSerials) > 0
        // N/min is leading
        _c := colBGN1
        if abs(_min) >= offsetBGN2
            _c := colBGN2
        if abs(_min) >= offsetBGN3
            _c := colBGN3
        if abs(_min) >= offsetBGN4
            _c := colBGN4
    // return
    [_c != color.white ? _c : na, _min, _max, _percArr]

p(serial, beginDate, endDate, beginRate, endRate) =>
    // just add data if we havent done it yet (they stay persistent)
    if barstate.isfirst
        if (beginDate != "" and endDate != "")
            // Prepare data
            percChg = ( (endRate-beginRate) / beginRate ) * 100
            // Add to persistent array
            array.set(arrBeginDate, serial, timestamp(beginDate))
            array.set(arrEndDate, serial, timestamp(endDate))
            array.set(arrBeginRate, serial, beginRate)
            array.set(arrEndRate, serial, endRate)
            // calced
            array.set(arrPercentRate, serial, percChg)

checkStart() =>
    _startSerial = 0
    if (array.size(arrBeginDate) > 0)
        // search array for start (ignore already processed serials)
        for i = runLastSerial+1 to array.size(arrBeginDate) - 1
            start = array.get(arrBeginDate, i)
            if (start < barOpenTime)
                _startSerial := i
                break
    //return
    _startSerial

checkStop(serial) =>
    _ret = false
    stop = array.get(arrEndDate, serial)
    if (stop < barCloseTime)
        _ret := true
    //_ret := true
    //return
    _ret
    
// RUN
run() =>
    _stopSerial = 0
    
    // CHECK FOR NEW START
    _startSerial = checkStart()
    
    if (_startSerial > 0)
        // found something
        // store persistent
        array.push(runSerials, _startSerial)

    // CHECK FOR STOP
    if array.size(runSerials) > 0
        for i = 0 to array.size(runSerials) - 1
            serial = array.get(runSerials, i)
            if (checkStop(serial))
                _stopSerial := serial
                break
        
    // return
    [_startSerial, _stopSerial]


// DATA PART BEGIN
// p(0, "2021-02-07T14:59:30.000Z", "2021-02-08T12:51:59.999Z", 1571.31, 1688.57)

${body}

// DATA PART END

[_startSerial, _stopSerial] = run()
if _startSerial > 0
    runLastSerial := _startSerial
    startSerial := _startSerial

// set bgcolor
[_bg, _min, _max, _percArr] = getBgColor()
bgcolor(_bg, editable=false)


if _stopSerial > 0
    stopSerial := _stopSerial
    array.remove(runSerials, array.indexof(runSerials, stopSerial))

// plot start shape
plotshape(startSerial > 0 ? array.get(arrBeginRate, startSerial) : na, "BUY", style=shape.triangleup, location=location.absolute, color=color.black, size = size.normal)
// plot start label (percentage)
percRate = array.get(arrPercentRate, startSerial)
label.new(startSerial > 0 ? bar_index : na, na, yloc=yloc.belowbar, style=(percRate<0 ? label.style_label_down : label.style_label_up), color=(percRate<0 ? color.red : color.green), textcolor=color.white, size= size.large, text=str.format("{0, number, #.##} %", abs(percRate)), tooltip=tostring(startSerial))
// plot stop shape
plotshape(stopSerial > 0 ? array.get(arrEndRate, stopSerial) : na, "SELL", style=shape.triangledown, location=location.absolute, color=color.black, size = size.normal)
// plot hidden info
plotchar(percRate, "% Rate", "", location.top, size = size.tiny, editable=false)

// DEBUG: Plot key values to the Data Window for debugging.
// plotchar(barOpenTime, "barOpenTime", "", location.top, size = size.tiny, editable=false)
// plotchar(barCloseTime, "barCloseTime", "", location.top, size = size.tiny, editable=false)
// plotchar(array.size(runSerials), "runSerials.size", "", location.top, size = size.tiny, editable=false)
// plotchar(runLastSerial, "runLastSerial", "", location.top, size = size.tiny, editable=false)
// plotchar(startSerial, "startSerial", "", location.top, size = size.tiny, editable=false)
// plotchar(stopSerial, "stopSerial", "", location.top, size = size.tiny, editable=false)
// plotchar(_min, "_min", "", location.top, size = size.tiny, editable=false)
// plotchar(_max, "_max", "", location.top, size = size.tiny, editable=false)
// plotchar(array.size(_percArr), "_percArr.size", "", location.top, size = size.tiny, editable=false)
// plotchar(array.size(_percArr) > 0 ? array.pop(_percArr) : na, "_percArr.first", "", location.top, size = size.tiny, editable=false)
`;

    return scr;
  }

  buildPinePositions(data: SAAggrTradingPosition[]): string {

    // Filter positions without begin AND end
    data = data.filter(act => act.beginDate !== undefined && act.endDate !== undefined);
    // Sort by serial
    data.sort((a, b) => a.serial - b.serial);

    let ret = '';
    for (let i = 0; i < data.length; i++) {
      ret += `p(${data[i].serial}, "${data[i].beginDate || ''}", "${data[i].endDate || ''
        }", ${data[i].beginRate || 0}, ${data[i].endRate || 0})\n`;
    }
    return ret;
  }

  async exportPos() {
    const projects = await this.getProjects();
    const project = projects.pop();
    const exchanges = await this.getProjectExchanges(project);
    const exchange = exchanges.pop();
    const pairs = await this.getExchangePairs(project, exchange);
    // const pair = pairs.pop();
    const pair = 'ADA-USDT';
    const sessions = await this.getSessions(project, exchange, pair);
    const session = sessions.pop();
    const sessionData = await this.loadSession(
      project,
      exchange,
      pair,
      session,
    );
    // console.log(sessionData);
    const aggrPos = sessionData.map(this.aggrPos);
    return this.getPineScript(this.buildPinePositions(aggrPos)) + '\n';
  }
}


