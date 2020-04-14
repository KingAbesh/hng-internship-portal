define([
  'knockout',
  './api',
  'jquery',
  'ojs/ojresponsiveutils',
  'ojs/ojresponsiveknockoututils',
  'ojs/ojcore',
  'ojs/ojrouter',
  'ojs/ojformlayout',
  'ojs/ojinputtext',
  'ojs/ojlabel',
  'ojs/ojselectcombobox',
  'ojs/ojbutton'
], function (ko, api, $, responsiveUtils, responsiveKnockoutUtils) {
  function RegisterViewModel () {
    var self = this
    var router = oj.Router.rootInstance

    self.isSmall = responsiveKnockoutUtils.createMediaQueryObservable(
      responsiveUtils.getFrameworkQuery(
        responsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY
      )
    )

    self.labelEdge = ko.computed(function () {
      return self.isSmall() ? 'top' : 'start'
    }, self)

    self.devstack = ko.observableArray([])

    var tracksURL = `${api}/api/track`

    //  Fetch all tracks
    self.fetchTracks = async () => {
      try {
        const response = await fetch(`${tracksURL}/all`, {})
        const {
          data: { data }
        } = await response.json()

        // var result = data.data.map(track => [track.id]);
        var result = data.map(track => ({
          value: `${track.id}`,
          label: track.track_name
        }))
        // console.log(result);

        self.devstack(result)

        // console.log(self.devstack());
      } catch (err) {
        console.log(err)
      }
    }
    self.fetchTracks()

    self.firstname = ko.observable('')
    self.lastname = ko.observable('')
    self.gender = ko.observable('')
    self.stack = ko.observableArray([])
    self.location = ko.observable('')

    // account info
    self.username = ko.observable('')
    self.email = ko.observable('')
    self.pass = ko.observable('')
    self.rpass = ko.observable('')

    self.clickedButton = ko.observable('(None clicked yet)')

    self.login = function () {
      router.go('login')
    }

    self.connected = function () {
      // Implement if needed
      function validate () {
        var sect = $('#fbk')
        var feedback = function (text, color = 'danger') {
          return `<div class=" mt-3 alert alert-${color} h6 show fb_alert" role="alert">
          <small>${text}</small>
        </div>`
        }

        var progressbar = function () {
          return `<div class="progress position-relative mt-3">
        <div class="position-absolute h-100 w-100 progress-bar progress-bar-striped progress-bar-animated bg-info"
          role="progressbar">
          <span class="oj-text-sm font-weight-bold">Processing registration</span>
        </div>
      </div>`
        }

        const firstname = self.firstname()
        const lastname = self.lastname()
        const gender = self.gender()
        const email = self.email()
        const username = self.username()
        const password = self.pass()
        const confirm_password = self.rpass()
        const tracks = self.stack().map(stack => {
          return stack
        })

        const location = self.location()

        if (
          (firstname &&
            lastname &&
            gender &&
            email &&
            username &&
            location &&
            password &&
            confirm_password) != ''
        ) {
          if (!(email.match(/([@])/) && email.match(/([.])/))) {
            validated = false
            sect.html(feedback('Please enter a valid email'))
          }
          if (password.length < 4 || confirm_password.length < 4) {
            validated = false
            sect.html(feedback('Passwords should be minimum 4 characters'))
          } else {
            if (password !== confirm_password) {
              sect.html(feedback('Passwords do not match'))
              validated = false
            }
          }

          const data = JSON.stringify({
            firstname: firstname,
            lastname: lastname,
            gender: gender,
            email: email,
            username: username,
            password: password,
            confirm_password: confirm_password,
            tracks: tracks,
            location: location
          })

          sect.html(progressbar())
          $.post(`${api}/api/register`, {
            firstname,
            lastname,
            gender,
            email,
            username,
            password,
            confirm_password,
            tracks,
            location
          })
            .done(({ status }) => {
              if (status == true) {
                sect.html(
                  feedback(
                    'Account created, redirecting to login page...',
                    'success'
                  )
                )
                setTimeout(function () {
                  router.go('login')
                }, 2000)
              }
            })
            .fail(err => {
              const { errors } = err.responseJSON
              if (errors) {
                if (errors.username) {
                  sect.html(
                    feedback(
                      `${errors.username}`
                    )
                  )
                } else if (errors.email) {
                  sect.html(
                    feedback(
                      `${errors.email}`
                    )
                  )
                } else if (errors.confirm_password) {
                  sect.html(
                    feedback(
                    `${errors.confirm_password}`
                    )
                  )
                }
              } else {
                sect.html(
                  feedback(
                    '"Please confirm that your email is registered on slack and try again"'
                  )
                )
              }
            })
        } else {
          console.log('wrong')
          sect.html(feedback('All fields are required'))
        }
      }

      $('#next').click(function () {
        $('#profileinfo').hide()
        $('#accinfo').show()
      })
      $('#prev').click(function () {
        $('#profileinfo').show()
        $('#accinfo').hide()
      })

      self.buttonClick = function () {
        validate()
      }
    }
  }

  return new RegisterViewModel()
})
