'use strict'

import React from 'react';
import Promise from 'promise';
import _ from 'underscore';
import LinearProgress from 'material-ui/LinearProgress';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Snackbar from 'material-ui/Snackbar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';

import MoreVert from 'material-ui/svg-icons/navigation/more-vert';

import Editor from './views/Editor.jsx';
import showAndHideMixin from './mixins/showAndHideMixin.js';

var WrapperLinearProgress = React.createClass({
    mixins:[ showAndHideMixin ],
    render() {
        var show = this.state.show;
        return (
            <div className='wrapperLinearProgress'>
                {show ? <LinearProgress mode="indeterminate" /> : null}
            </div>
        )
    }
});
var WrapperSnackbar = React.createClass({
    getDefaultProps() {
        return {
            defaultShow: false
        };
    },
    getInitialState() {
        return {
            show: this.props.defaultShow,
            message: ''
        };
    },
    handleRequestClose() {
        this.setState({
            show: false,
        });
    },
    show(message) {
        this.setState({
            show: true,
            message
        });
    },
    render() {
        return (
            <Snackbar
                open={this.state.show}
                message={this.state.message}
                autoHideDuration={3000}
                onRequestClose={this.handleRequestClose}
            />
        );
    }
});

export default React.createClass({
    childContextTypes: {
        ui: React.PropTypes.object,
        file: React.PropTypes.object
    },
    getInitialState() {
        return {
            rules: []
        };
    },
    componentDidMount() {
        this.refresh();
        chrome.runtime.getPlatformInfo(function(platformInfo){
            this.os = platformInfo.os;
        });
    },
    getChildContext: function() {
        return {
            ui: {
                showWrapperLinearProgress: () => this.showWrapperLinearProgress(),
                hideWrapperLinearProgress: () => this.hideWrapperLinearProgress(),
                showLoading: () => this.showLoading(),
                hideLoading: () => this.hideLoading(),
                alert: (...args) => window.alert(...args),
                confirm: (...args) => window.confirm(...args),
                showHeader: () => this.showHeader(),
                hideHeader: () => this.hideHeader(),
            },
            file: {
                save: (...args) => this.save(...args),
                remove: (...args) => this.remove(...args),
            }
        };
    },
    showWrapperLinearProgress() {
        this.refs.wrapperLinearProgress.show();
    },
    hideWrapperLinearProgress() {
        this.refs.wrapperLinearProgress.hide();
    },
    showWrapperSnackbar(message) {
        this.refs.wrapperSnackbar.show(message);
    },
    save: _.debounce(function() {
        // this.setState({rules});
        this.saveToFile();
    }, 500),
    saveToFile: _.debounce(function() {
        var decollator = this.os == 'win' ? '\r\n' : '\n';
        var rulesStr = this.state.rules.map((rule) => {
            return `  ${rule.enable ? '' : '// '}"${rule.str}",`
        }).join(decollator);
        this.write([this.preContent.join(decollator), rulesStr, this.posContent.join(decollator)].join(decollator)).then((res) => {
        }).catch((e) => {
            console.log(e)
        });
    }, 2000),
    remove(i) {
        var rules = this.state.rules;
        rules.splice(i, 1);
        this.setState({rules}, this.save);
    },
    refresh() {
        setTimeout(() => {
            this.getEntry().then((gfwlistEntry) => {
                this.gfwlistEntry = gfwlistEntry;
                this.read().then((result) => {
                    var lines = result.split('\n');
                    var startIndex = _.findIndex(lines, (line) => {
                        return /var\ +rules\ *= *\[/.test(line);
                    });
                    if(startIndex < 0) {
                        throw 'no start';
                        return;
                    }
                    var endIndex = _.findIndex(lines, (line, i) => {
                        return /^ *\] *\;/.test(line);
                    });
                    if(endIndex < 0) {
                        throw 'no end';
                        return;
                    }
                    var preContent = lines.slice(0, startIndex + 1),
                        posContent = lines.slice(endIndex),
                        rules = lines.slice(startIndex + 1, endIndex);
                    this.preContent = preContent;
                    this.posContent = posContent;
                    rules = rules.map((rule, i) => {
                        // 去除首尾空格换行符等
                        rule = rule.trim();
                        // 注释
                        // if(rule.match(/.+\/\/.*/)) {

                        // }
                        // 注释翻译
                        if(rule.match(/^\/\//)) {
                            rule = {
                                str: rule.replace(/^\/\//, '').trim(),
                                enable: false
                            };
                        } else {
                            rule = {
                                str: rule,
                                enable: true
                            }
                        }
                        rule.key = _.uniqueId('rule_');
                        // 取消头尾的"", 以及win下的/r
                        rule.str = rule.str.replace(/(^(\"|\'))|((\"|\') *\,$)/g, '');
                        if(i == rules.length - 1) {
                            rule.str = rule.str.replace(/((\"|\')$)/g, '');
                        }
                        return rule;
                    });
                    this.setState({rules});
                }).catch((e) => {
                    console.log(e)
                })
            }).catch((e) => {
                console.log(e)
                this.chooseEntry().then(() => this.refresh());
            });
        }, 300)
    },
    chooseEntry() {
        return new Promise((resolve, reject) => {
            chrome.fileSystem.chooseEntry({
                type: 'openWritableFile'
            }, function(gfwlistEntry) {
                if(chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (gfwlistEntry) {
                    gfwlistEntry.file(function(file) {
                        chrome.storage.local.set({
                            'gfwlistEntry': chrome.fileSystem.retainEntry(gfwlistEntry)
                        });
                        resolve(gfwlistEntry);
                    });
                } else {
                    reject('no gfwlistEntry');
                }
            })
        });
    },
    getEntry() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('gfwlistEntry', function(items) {
                if (items.gfwlistEntry) {
                    chrome.fileSystem.isRestorable(items.gfwlistEntry, function(bIsRestorable) {
                        if(bIsRestorable) {
                            chrome.fileSystem.restoreEntry(items.gfwlistEntry, function(entry) {
                                chrome.fileSystem.isWritableEntry(entry, function(isWritable) {
                                    resolve(entry);
                                });
                            });
                        } else {
                            reject('Is not restorable')
                        }
                    });
                } else {
                    reject('have no gfwlistEntry')
                }
            });
        });
    },
    write(str) {
        return new Promise((resolve, reject) => {
            this.gfwlistEntry.createWriter(function(writer) {
                var data = new Blob([str], {type: 'text/plain;charset=UTF-8'}),
                    isTruncate = false;
                writer.onerror = function() {
                    reject();
                }
                writer.onwriteend = function() {
                    if(!isTruncate) {
                        console.log(data, writer)
                        this.truncate(this.position);
                        isTruncate = true;
                    } else {
                        console.log(data, writer)
                        resolve(writer);
                    }
                };
                writer.onwritestart = function () {
                };
                writer.onabort = function () {
                };
                writer.onprogress = function () {
                };
                writer.onwrite = function () {
                };
                writer.write(data);
            });
        });
    },
    read() {
        return new Promise((resolve, reject) => {
            this.gfwlistEntry.file(function(file){
                var reader = new FileReader;
                reader.onabort = function() {
                }
                reader.onerror = function() {
                    reject();
                }
                reader.onload = function() {
                }
                reader.onloadend = function() {
                    resolve(reader.result);
                }
                reader.onloadstart = function() {
                }
                reader.onprogress = function() {
                }
                reader.readAsText(file);
            })
        });
    },
    onAdd() {
        var value = this.refs.input.getValue().trim(),
            rules = this.state.rules;
        if(value.length) {
            rules.unshift({
                str: value,
                key: _.uniqueId('rule_'),
                enable: true
            });
            this.refs.input.input.value = '';
            this.setState({
                filterString: ''
            }, this.save);
        } else {
            this.showWrapperSnackbar('请输入后再添加');
        }
    },
    onFilter: _.debounce(function(e, value) {
        this.setState({
            filterString: value
        });
    }, 500),
    menuHandle(e, o) {
        switch(o.key) {
            case 'refresh': {
                this.refresh();
                break;
            }
            case 'select': {
                this.chooseEntry().then(() => this.refresh()).catch((e) => {
                    console.log(e)
                });
                break;
            }
            case 'change': {
                this.setState({
                    speedMode: !this.state.speedMode
                });
                break;
            }
        }
    },
    render() {
        return (
            <div>
                <div className='fixedHeader'>
                    <WrapperLinearProgress defaultShow={false} ref='wrapperLinearProgress'/>
                    <div>
                        
                    </div>
                    <div className='flex'>
                        <IconMenu
                            onItemTouchTap={(...args) => this.menuHandle(...args)}
                            iconButtonElement={
                                <IconButton>
                                    <MoreVert />
                                </IconButton>
                            }
                        >
                            <MenuItem primaryText="刷新" key='refresh' />
                            <MenuItem primaryText="重选文件" key='select' />
                            <MenuItem primaryText="切换控件" key='change' />
                        </IconMenu>
                        <TextField
                            ref='input'
                            hintText="输入来筛选或添加"
                            onChange={(...args) => this.onFilter(...args)}
                            fullWidth={true}
                        />
                        <RaisedButton label="添加" primary={true} onClick={this.onAdd} style={{
                            height: 38,
                            margin: 5
                        }} />
                    </div>
                </div>
                <div className='contentWrapper'>
                    <Editor rules={this.state.rules} filterString={this.state.filterString} speedMode={this.state.speedMode}/>
                </div>
                <WrapperSnackbar ref='wrapperSnackbar'/>
            </div>
        );
    }
})