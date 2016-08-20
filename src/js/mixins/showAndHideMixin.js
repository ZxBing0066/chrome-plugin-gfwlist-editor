export default {
    getDefaultProps() {
        return {
            defaultShow: false
        };
    },
    getInitialState() {
        return {
            show: this.props.defaultShow
        };
    },
    show() {
        this.setState({
            show: true
        });
    },
    hide() {
        this.setState({
            show: false
        });
    },
    toggle() {
        this.setState({
            show: !this.state.show
        });
    }
}