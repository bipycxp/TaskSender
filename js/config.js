var require = {

    baseUrl : '/js',

    paths : {
        jquery : 'lib/jquery',
        semantic : 'lib/semantic.min',
        socialShare : 'lib/socialShare',

        Background : 'pages/Background',
        Settings : 'pages/Settings',

        Service : 'services/Service',
        allServices : 'services/allServices'
    },

    shim : {
        semantic : {
            deps : ['jquery']
        },
        socialShare : {
            deps : ['jquery']
        }
    }
};
