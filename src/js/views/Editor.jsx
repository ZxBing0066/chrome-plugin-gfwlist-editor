'use strict'

import React from 'react';
import _ from 'underscore';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import Toggle from 'material-ui/Toggle';

import RemoveCircle from 'material-ui/svg-icons/content/remove-circle';

const PRELOAD_OFFSET_HEIGHT = 500,
    DEFAULT_DISPLAY_LENGTH = 100,
    ADDED_DISPLAY_LENGTH = 50;

export default React.createClass({
    contextTypes: {
        ui: React.PropTypes.object.isRequired,
        file: React.PropTypes.object.isRequired,
    },
    getDefaultProps() {
        return {
            rules: [],
            filterString: '',
            speedMode: false
        };
    },
    getInitialState() {
        return this.getStateFromProps(this.props);
    },
    componentDidMount() {
        this.refs.wrapper.onscroll = this.onScroll;
    },
    componentWillReceiveProps(nextProps) {
        this.setState(this.getStateFromProps(nextProps));
    },
    componentWillUnmount() {
        this.refs.wrapper.onscroll = null;
    },
    getStateFromProps(props) {
        var nRules = props.rules,
            nFilterString = props.filterString.trim(),
            oRules = this.state && this.state.rules,
            oFilterString = this.state && this.state.filterString,
            oSpeedMode = this.state && this.state.speedMode,
            rules = [],
            speedMode = props.speedMode;
        if(nRules == oRules && nFilterString == oFilterString && speedMode == oSpeedMode) {
            return {};
        }
        if(nRules == oRules && nFilterString == oFilterString) {
            return {
                speedMode
            }
        }
        var filterString = nFilterString;
        rules = nRules.map((rule, i) => {
            rule._index = i;
            return rule;
        })
        if(filterString && filterString.length > 0) {
            rules = _.filter(rules, function(rule) {
                return rule.str.indexOf(filterString) >= 0;
            });
        }
        var displaiedLength = this.state ? this.state.displaiedLength : DEFAULT_DISPLAY_LENGTH;
        if(displaiedLength < DEFAULT_DISPLAY_LENGTH) {
            displaiedLength = DEFAULT_DISPLAY_LENGTH
        }
        if(displaiedLength > rules.length) {
            displaiedLength = rules.length
        }
        return {
            rules,
            displaiedLength,
            speedMode
        };
    },
    onScroll(e) {
        if(this.lock) return;
        var { rules, displaiedLength } = this.state,
            { wrapper, list } = this.refs;
        if(rules.length <= displaiedLength) return;
        if(wrapper.scrollTop + wrapper.clientHeight > list.clientHeight - PRELOAD_OFFSET_HEIGHT) {
            this.addDisplaiedRules(ADDED_DISPLAY_LENGTH);
        }
    },
    addDisplaiedRules(l) {
        // this.context.ui.showWrapperLinearProgress();
        this.lock = true;
        var { rules, displaiedLength } = this.state;
        if(rules.length > displaiedLength + l) {
            displaiedLength = displaiedLength + l;
        } else {
            displaiedLength = rules.length;
        }
        this.setState({ displaiedLength }, () => {
            this.lock = false;
            // this.context.ui.hideWrapperLinearProgress();
        });
    },
    toggleRule(i) {
        var { rules } = this.state;
        rules[i].enable = !rules[i].enable;
        this.context.file.save();
    },
    removeRule(rule, e) {
        this.context.file.remove(rule._index);
        e.preventDefault();
        e.stopPropagation();
    },
    render() {
        var { rules, displaiedLength, speedMode } = this.state,
            displaiedRules = rules.slice(0, displaiedLength);
        return (
            <div className='wrapper editor' ref='wrapper'>
                <div ref='list'>
                    {!speedMode ?
                        <List>
                            {displaiedRules.map((rule, i) => {
                                return (
                                    <ListItem
                                        key={rule.key}
                                        primaryText={rule.str}
                                        leftIcon={
                                            <RemoveCircle onClick={(...args) => {
                                                this.removeRule(rule, ...args);
                                            }}/>
                                        }
                                        rightToggle={
                                            <Toggle
                                                defaultToggled={rule.enable}
                                                onToggle={(...args) => {
                                                    this.toggleRule(i, ...args);
                                                }}
                                            />
                                        }
                                    />
                                );
                            })}
                        </List> :
                        <ul className='list wrapper'>
                            {displaiedRules.map((rule, i) => {
                                return (
                                    <li key={rule.key}>
                                        <i onClick={(...args) => {
                                            this.removeRule(rule, ...args);
                                        }}>x</i>
                                        <span className='text'>{rule.str}</span>
                                        <input type="checkbox" defaultChecked={rule.enable} onChange={(...args) => {
                                            this.toggleRule(i, ...args);
                                        }}/>
                                    </li>
                                );
                            })}
                        </ul>
                    }
                </div>
            </div>
        );
    }
})