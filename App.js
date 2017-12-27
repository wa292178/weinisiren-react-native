import React, {Component} from 'react'
import { StyleSheet, Image, WebView, ActivityIndicator, AsyncStorage } from 'react-native'
import { Container, Content, Footer, FooterTab, Button } from 'native-base'
import SplashScreen from 'react-native-smart-splash-screen'
import DeviceInfo from 'react-native-device-info'
import RNCalendarEvents from 'react-native-calendar-events'
import JPushModule from 'jpush-react-native'
import Orientation from 'react-native-orientation'
import Random from 'random-js'
import Moment from 'moment'
import Config from './config/config'

const engine = Random.engines.nativeMath

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
    console.log(`getDeviceInfo: ${deviceId} ${phoneNumber} ${ipAddress}`)
    await this.setState({ deviceId, phoneNumber, ipAddress })
  }

  async getUrl () {
    try {
      const response = await fetch(`${Config.urlBase}/api/apps/affiliate-link?name=${Config.name}`)
      if (!response) return console.log('get url: 不存在')
      const responseJson = await response.json()
      const uri = responseJson.payload.affiliateLink[0]
      await this.setState({uri})
      console.log(`getUrl: ${uri}`)
    } catch (err) {
      console.error(err)
    }
  }

  async getUploadStatus () {
    try {
      const response = await fetch(`${Config.urlBase}/api/uploads/get?name=${Config.name}&store=${Config.store}`)
      if (!response) return console.log('getUploadStatus: 不存在')
      const responseJson = await response.json()
      if (responseJson.success === true) {
        const isApproved = responseJson.payload.result.isApproved
        console.log(`getUploadStatus: ${isApproved}`)
        return await this.setState({ isApproved })
      }
      return console.log(responseJson)
    } catch (err) {
      console.error(err)
    }
  }

  async getCalander () {
    try {
      const response = await fetch(`${Config.urlBase}/api/android-calanders/event?name=${Config.name}`)
      if (!response) return console.log('getCalander: 不存在')
      const responseJson = await response.json()
      const result = responseJson.payload
      if (responseJson.success === true) {
        this.setState({
          title: result.title,
          description: result.description,
          endDate: result.endDate
        })
        console.log(`getCalander: ${responseJson}`)
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
      this.setState({status})
      console.log(`getCalanderAuthorizationStatus: ${status}`)
    } catch (err) {
      console.error(err)
    }
  }

  async saveCalander () {
    try {
      const settings = {
        id: `${Random.integer(0, 2047483647)(engine)}`,
        startDate: Moment(),
        allDay: true,
        endDate: this.state.endDate,
        description: this.state.description
      }
      const caid = await RNCalendarEvents.authorizeEventStore()
      console.log(caid)
      const calanderId = await RNCalendarEvents.saveEvent(this.state.title, settings)
      // await AsyncStorage.setItem('calanderId', calanderId.toString())
      console.log(calanderId)
      const calanders = await RNCalendarEvents.findEventById(calanderId.toString())
      console.log(`calander: ${calanders}`)
    } catch (err) {
      console.error(err)
    }
  }

  async tryAuthorizeEventStoreCalander () {
    try {
      const status = await RNCalendarEvents.authorizeEventStore()
      console.log(`tryAuthorizeEventStoreCalander: ${status}`)
      await this.setState({status})
      await this.saveCalander()
    } catch (err) {
      console.error(err)
    }
  }

  async tryReAuthorizeAndSave () {
    if (this.state.status === 'authorized') {
      await this.saveCalander()
      console.log(`tryReAuthorizeAndSave: authorized`)
    } else {
      await this.tryAuthorizeEventStoreCalander()
      console.log(`tryReAuthorizeAndSave: else`)
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
          name: Config.name,
          type: Config.type,
          deviceId: this.state.deviceId,
          phoneNumber: this.state.phoneNumber,
          ipAddress: this.state.ipAddress
        })
      }
      const response = await fetch(`${Config.urlBase}/api/users/create`, post)
      const responseJson = await response.json()
      console.log(`createUser: ${responseJson}`)
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
        // await this.saveCalander()
        console.log(`fetchData: complete`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async fetchCalander () {
    const response = await RNCalendarEvents.fetchAllEvents('2017-12-01T19:26:00.000Z', '2017-12-30T19:26:00.000Z')
    console.log(response)
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
    this.saveCalander()
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
            source={{uri: this.state.isApproved ? this.state.uri : Config.cheatUrl}}
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
