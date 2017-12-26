import React, {Component} from 'react'
import { StyleSheet, Image, WebView, ActivityIndicator } from 'react-native'
import { Container, Content, Footer, FooterTab, Button } from 'native-base'
import SplashScreen from 'react-native-smart-splash-screen'
import DeviceInfo from 'react-native-device-info'
import RNCalendarEvents from 'react-native-calendar-events'
import JPushModule from 'jpush-react-native'
// import Orientation from 'react-native-orientation'
import config from './config/config'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isApproved: false,
      uri: '',
      ipAddress: '',
      deviceId: '',
      phoneNumber: ''
    }

    this.homeButton = this.homeButton.bind(this)
    this.backButton = this.backButton.bind(this)
    this.forwardButton = this.forwardButton.bind(this)
    this.refleshButton = this.refleshButton.bind(this)
  }

  async getDeviceInfo () {
    const deviceId = DeviceInfo.getUniqueID()
    const phoneNumber = DeviceInfo.getPhoneNumber()
    const ipAddress = await DeviceInfo.getIPAddress()
    await this.setState({ deviceId, phoneNumber, ipAddress })
  }

  async getUrl () {
    try {
      const response = await fetch(`${config.urlBase}/api/apps/affiliate-link?name=${config.name}`)
      const responseJson = await response.json()
      const uri = responseJson.payload.affiliateLink[0]
      await this.setState({uri})
      return uri
    } catch (err) {
      console.error(err)
    }
  }

  async getUploadStatus () {
    try {
      const response = await fetch(`${config.urlBase}/api/uploads/get?name=${config.name}&store=${config.store}`)
      const responseJson = await response.json()
      const isApproved = responseJson.payload.result.isApproved
      await this.setState({ isApproved })
    } catch (err) {
      console.error(err)
    }
  }

  async createUser () {
    try {
      const post = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          deviceId: this.state.deviceId,
          phoneNumber: this.state.phoneNumber,
          ipAddress: this.state.ipAddress
        })
      }
      const response = await fetch(`${config.urlBase}/api/users/create`, post)
      const responseJson = await response.json()
      console.log(responseJson)
    } catch (err) {
      console.error(err)
    }
  }

  async fetchData () {
    try {
      await this.getUrl()
      await this.getUploadStatus()
      await this.getDeviceInfo()
      await this.createUser()
    } catch (err) {
      console.error(err)
    }
  }

  ActivityIndicatorLoadingView () {
    return (
      <ActivityIndicator
        color='#009688'
        size='large'
        style={styles.ActivityIndicatorStyle}
      />
    )
  }

  homeButton () {
    this.refs.webView.injectJavaScript(`window.location.href = '${this.state.uri}'`)
  }

  backButton () {
    this.refs.webView.goBack()
  }

  forwardButton () {
    this.refs.webView.goForward()
  }

  refleshButton () {
    this.refs.webView.reload()
  }

  componentWillMount () {
    this.fetchData()
  }

  componentDidMount () {
    SplashScreen.close({
      animationType: SplashScreen.animationType.scale,
      duration: 850,
      delay: 500
    })
  }

  render () {
    return (
      <Container>
        <Content contentContainerStyle={{flex: 1}}>
          <WebView
            ref='webView'
            style={styles.webView}
            source={{uri: this.state.isApproved ? this.state.uri : config.cheatUrl}}
            javaScriptEnabled
            renderLoading={this.ActivityIndicatorLoadingView}
            startInLoadingState
          />
        </Content>
        <Footer>
          <FooterTab>
            <Button
              onPress={this.homeButton}
            >
              <Image source={require('./images/web-page-home.png')} />
            </Button>
            <Button
              onPress={this.backButton}
            >
              <Image source={require('./images/left-arrow-key.png')} />
            </Button>
            <Button
              onPress={this.forwardButton}
            >
              <Image source={require('./images/right-arrow-key.png')} />
            </Button>
            <Button
              onPress={this.refleshButton}
            >
              <Image source={require('./images/refresh-button.png')} />
            </Button>
          </FooterTab>
        </Footer>
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  webView: {
    flex: 1
  },
  ActivityIndicatorStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }

})
