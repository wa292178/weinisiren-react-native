import React, {Component} from 'react'
import { StyleSheet, Image, WebView, ActivityIndicator, AsyncStorage } from 'react-native'
import { Container, Content, Footer, FooterTab, Button } from 'native-base'
import SplashScreen from 'react-native-smart-splash-screen'
import DeviceInfo from 'react-native-device-info'
import RNCalendarEvents from 'react-native-calendar-events'
import JPushModule from 'jpush-react-native'
import Orientation from 'react-native-orientation'
import config from './config/config'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isApproved: '',
      uri: '',
      ipAddress: '',
      deviceId: '',
      phoneNumber: '',
      status: 'denied',
      title: '',
      description: '',
      endDate: ''
    }

    this._homeButton = this._homeButton.bind(this)
    this._backButton = this._backButton.bind(this)
    this._forwardButton = this._forwardButton.bind(this)
    this._refleshButton = this._refleshButton.bind(this)
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

  async unlockOrientation () {
    try {
      const orientation = await Orientation.getOrientation()
      if (orientation === 'LANDSCAPE') {
        Orientation.unlockAllOrientations()
      }
    } catch (err) {
      console.error(err)
    }
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
      if (!response) return console.log('get url: 不存在')
      const responseJson = await response.json()
      const uri = responseJson.payload.affiliateLink[0]
      await this.setState({uri})
    } catch (err) {
      console.error(err)
    }
  }

  async getUploadStatus () {
    try {
      const response = await fetch(`${config.urlBase}/api/uploads/get?name=${config.name}&store=${config.store}`)
      if (!response) return console.log('getUploadStatus: 不存在')
      const responseJson = await response.json()
      if (responseJson.success === true) {
        const isApproved = responseJson.payload.result.isApproved
        return await this.setState({ isApproved })
      }
      return console.log(responseJson)
    } catch (err) {
      console.error(err)
    }
  }

  async getCalander () {
    try {
      const response = await fetch(`${config.urlBase}/api/android-calanders/event?name=${config.name}`)
      if (!response) return console.log('getCalander: 不存在')
      const responseJson = await response.json()
      const result = responseJson.payload
      if (responseJson.success === true) {
        this.setState({
          title: result.title,
          description: result.description,
          endDate: result.endDate
        })
      } else {
        console.log(result.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async getCalanderAuthorizationStatus () {
    try {
      const status = await RNCalendarEvents.authorizationStatus()
      console.log(status)
      this.setState({status})
    } catch (err) {
      console.error(err)
    }
  }

  async saveCalander () {
    try {
      const settings = {
        startDates: Date.now(),
        endDate: Date.now(),
        description: this.state.description
      }
      const calanderId = await RNCalendarEvents.saveEvent(this.state.title, settings)
      await AsyncStorage.setItem('calanderId', calanderId)
    } catch (err) {
      console.error(err)
    }
  }

  async tryAuthorizeEventStoreCalander () {
    try {
      const status = await RNCalendarEvents.authorizeEventStore()
      await this.setState({status})
      await this.saveCalander()
    } catch (err) {
      console.error(err)
    }
  }

  async tryReAuthorizeAndSave () {
    if (this.state.status === 'authorized') {
      await this.saveCalander()
    } else {
      await this.tryAuthorizeEventStoreCalander()
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
    } catch (err) {
      console.error(err)
    }
  }

  async fetchData () {
    try {
      await this.getUploadStatus()
      if (this.state.isApproved === true) {
        await this.getCalanderAuthorizationStatus()
        await this.getUrl()
        await this.getDeviceInfo()
        await this.getCalander()
        await this.createUser()
        await this.tryReAuthorizeAndSave()
      }
    } catch (err) {
      console.error(err)
    }
  }

  _homeButton () {
    this.refs.webView.injectJavaScript(`window.location.href = '${this.state.uri}'`)
  }

  _backButton () {
    this.refs.webView.goBack()
  }

  _forwardButton () {
    this.refs.webView.goForward()
  }

  _refleshButton () {
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

    if (this.state.isApproved === false) {
      Orientation.lockToLandscape()
    }
  }
  
  componentWillUnmount () {
    this.unlockOrientation()
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
              onPress={this._homeButton}
            >
              <Image source={require('./images/web-page-home.png')} />
            </Button>
            <Button
              onPress={this._backButton}
            >
              <Image source={require('./images/left-arrow-key.png')} />
            </Button>
            <Button
              onPress={this._forwardButton}
            >
              <Image source={require('./images/right-arrow-key.png')} />
            </Button>
            <Button
              onPress={this._refleshButton}
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
