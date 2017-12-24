import React, {Component} from 'react';
import { StyleSheet, Image, WebView } from 'react-native';
import { Container, Content, Header, Footer, FooterTab, Button, Icon } from 'native-base';
import SplashScreen from 'react-native-smart-splash-screen'
import DeviceInfo from 'react-native-device-info';
import RNCalendarEvents from 'react-native-calendar-events';


export default class App extends Component {
    constructor (props) {
        super(props);
        this.state = {
            name : '威尼斯人娱乐场-ANDROID',
            upload: '360',
            uri : '',
            ipAddress: '',
            deviceId: '',
            phoneNumber: '',
            type : 2,
            urlBase: "http://54.215.160.108:4040"
        }
    }

    async getDeviceInfo() {
        const deviceId = DeviceInfo.getUniqueID();
        const phoneNumber = DeviceInfo.getPhoneNumber();
        const ipAddress = await DeviceInfo.getIPAddress();
        await this.setState({ deviceId, phoneNumber, ipAddress })
    }

    async getUrl() {
        try {
            const response = await fetch(`${this.state.urlBase}/api/apps/affiliate-link`);
            const responseJson = await response.json();
            const uri = responseJson.payload.affiliateLink[0];
            await this.setState({uri});
            return uri;
        } catch(err) {
            console.error(err);
        }
    }



    async createUser() {
        try {
            const post = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: this.state.name,
                    type: this.state.type,
                    deviceId: this.state.deviceId,
                    phoneNumber: this.state.phoneNumber,
                    ipAddress: this.state.ipAddress,
                })
            };
            const response = await fetch(`${this.state.urlBase}/api/users/create`, post);
            const responseJson = await await response.json();
            console.log(responseJson);
        } catch(err) {
            console.error(err);
        }
    }

    async fetchData() {
        try {
            await this.getDeviceInfo();
            await this.getUrl();
            await this.createUser();
            console.log(this.state);
        } catch (err) {
            console.error(err);
        }
    }

    onNavigationStateChange(event){
        console.log(event);
    }

    componentWillMount() {
        this.fetchData();
    }


    componentDidMount() {
        SplashScreen.close({
            animationType: SplashScreen.animationType.scale,
            duration: 850,
            delay: 500,
        });
    }

    render() {
        return (
            <Container>
                <Content contentContainerStyle={{flex: 1}}>
                   <WebView
                        style={styles.webView}
                        source={{uri: this.state.uri}}
                        onNavigationStateChange={this.onNavigationStateChange.bind(this)}
                   />
                </Content>
                <Footer>
                    <FooterTab>
                    <Button>
                        <Image source={require('./images/web-page-home.png')} />
                    </Button>
                    <Button>
                        <Image source={require('./images/left-arrow-key.png')} />
                    </Button>
                    <Button>
                        <Image source={require('./images/right-arrow-key.png')} />
                    </Button>
                    <Button>
                        <Image source={require('./images/refresh-button.png')} />
                    </Button>
                    </FooterTab>
                </Footer>
            </Container>
        );
    }
}

const styles = StyleSheet.create({
    webView: {
        flex: 1,
    }

});
