import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React from 'react'
import { COLORS } from '../constants/colors'

const Rules = () => {
  return (
    <ScrollView style={styles.rulesContainer}>
      <View style={styles.rulesContent}>
        <Text style={styles.title}>Regulamin</Text>
        <Text style={styles.subtitle}>
          REGULAMIN SERWISU I APLIKACJI boiskoplus.pl obowiązuje od dnia
          28.10.2025 roku
        </Text>
        <Text style={styles.paragraph}>
          §1. Postanowienia ogólne Regulamin określa zasady korzystania z
          serwisu internetowego boiskoplus.pl oraz aplikacji mobilnej BoiskoPlus
          (dalej łącznie: Serwis), prowadzonego przez: TRADEO, jednoosobową
          działalność gospodarczą z siedzibą w [adres, np. Skierniewice, ul.
          Broniewskiego 71 ], NIP: 8361883924, adres e-mail:
          kontakt@boiskoplus.pl. Serwis boiskoplus.pl umożliwia Użytkownikom:
          tworzenie kont i profili sportowych, umawianie się na mecze i
          wydarzenia sportowe, dodawanie obiektów sportowych (boisk, hal,
          orlików), komentowanie i wysyłanie wiadomości do innych Użytkowników,
          korzystanie z funkcji społecznościowych ułatwiających organizację gier
          zespołowych. Korzystanie z Serwisu jest dobrowolne i bezpłatne, jednak
          w przyszłości możliwe będzie wprowadzenie usług płatnych (pakietów
          premium lub reklam) – o czym Użytkownicy zostaną poinformowani z
          odpowiednim wyprzedzeniem. Niniejszy Regulamin jest udostępniony
          nieodpłatnie na stronie internetowej boiskoplus.pl w sposób
          umożliwiający jego pobranie, utrwalenie i wydruk.
        </Text>
        <Text style={styles.paragraph}>
          §2. Definicje Na potrzeby niniejszego Regulaminu przyjmuje się
          następujące znaczenia pojęć: Serwis / Aplikacja – platforma
          internetowa i aplikacja mobilna dostępna pod adresem boiskoplus.pl,
          umożliwiająca komunikację i organizację wydarzeń sportowych.
          Usługodawca – TRADEO, NIP: 8361883924. Użytkownik – każda osoba
          fizyczna, która korzysta z Serwisu, w tym tworzy konto, uczestniczy w
          wydarzeniach lub komunikuje się z innymi użytkownikami. Konto –
          indywidualna przestrzeń Użytkownika w Serwisie, tworzona po
          rejestracji. Wydarzenie sportowe – spotkanie sportowe organizowane
          przez Użytkowników (np. mecz, trening, turniej). Profil – publiczna
          lub półpubliczna część Konta zawierająca dane i informacje o
          Użytkowniku. Regulamin – niniejszy dokument określający zasady
          korzystania z Serwisu.
        </Text>
        <Text style={styles.paragraph}>
          §3. Zasady korzystania z Serwisu Korzystanie z Serwisu wymaga: dostępu
          do Internetu, aktualnej przeglądarki internetowej lub aplikacji
          mobilnej, aktywnego adresu e-mail. Rejestracja w Serwisie jest
          dobrowolna. Użytkownik może w dowolnym momencie usunąć swoje Konto,
          wysyłając prośbę na adres kontaktowy Usługodawcy. Użytkownik
          zobowiązuje się do korzystania z Serwisu w sposób zgodny z prawem,
          zasadami współżycia społecznego i niniejszym Regulaminem. Zabronione
          jest: publikowanie treści niezgodnych z prawem, wulgarnych,
          obraźliwych lub naruszających dobra osobiste innych osób, podszywanie
          się pod inne osoby, wykorzystywanie Serwisu do celów reklamowych lub
          komercyjnych bez zgody Usługodawcy, próby ingerencji w działanie
          Serwisu lub pozyskiwania danych innych Użytkowników. Usługodawca
          zastrzega sobie prawo do: czasowego lub trwałego zablokowania Konta
          Użytkownika naruszającego Regulamin, usunięcia treści sprzecznych z
          prawem lub zasadami społeczności, wprowadzania nowych funkcji lub
          zmian w Serwisie.
        </Text>
        <Text style={styles.paragraph}>
          §4. Odpowiedzialność Usługodawca dokłada starań, by Serwis działał
          nieprzerwanie i bez błędów, jednak nie ponosi odpowiedzialności za
          przerwy w działaniu spowodowane: siłą wyższą, awarią sieci lub
          urządzeń, modernizacjami lub konserwacją Serwisu, działaniami osób
          trzecich niezależnych od Usługodawcy. Usługodawca nie ponosi
          odpowiedzialności za: zachowania Użytkowników i publikowane przez nich
          treści, skutki umawiania się przez Użytkowników na mecze i wydarzenia,
          jakiekolwiek szkody powstałe w wyniku kontaktów między Użytkownikami.
          Użytkownik ponosi pełną odpowiedzialność za swoje działania i
          publikowane treści w Serwisie. Usługodawca zastrzega, że Serwis nie
          jest pośrednikiem ani organizatorem wydarzeń sportowych – pełni
          wyłącznie funkcję platformy łączącej Użytkowników.
        </Text>
        <Text style={styles.paragraph}>
          §5. Dane osobowe i prywatność Administratorem danych osobowych
          Użytkowników jest TRADEO, NIP: 8361883924. Dane osobowe są
          przetwarzane zgodnie z przepisami RODO (UE 2016/679) oraz krajowymi
          przepisami o ochronie danych osobowych, w celu: świadczenia usług
          drogą elektroniczną, utrzymania Konta Użytkownika, kontaktu i obsługi
          technicznej, marketingu własnych usług (za zgodą Użytkownika).
          Użytkownik ma prawo do: wglądu do swoich danych, ich poprawiania,
          ograniczenia przetwarzania lub usunięcia, cofnięcia zgody na
          przetwarzanie danych, wniesienia skargi do Prezesa Urzędu Ochrony
          Danych Osobowych. Szczegółowe zasady przetwarzania danych określa
          Polityka Prywatności i Plików Cookies, dostępna w Serwisie.
        </Text>
        <Text style={styles.paragraph}>
          §6. Reklamacje Użytkownik może składać reklamacje dotyczące
          funkcjonowania Serwisu na adres: kontakt@boiskoplus.pl . Reklamacja
          powinna zawierać opis problemu oraz dane umożliwiające identyfikację
          Użytkownika. Usługodawca rozpatruje reklamacje w terminie 14 dni od
          otrzymania.
        </Text>
        <Text style={styles.paragraph}>
          §7. Zmiany Regulaminu Usługodawca może wprowadzać zmiany w
          Regulaminie, w szczególności w przypadku: zmian w obowiązującym
          prawie, zmian w funkcjonowaniu Serwisu lub wprowadzania nowych
          funkcji. O każdej zmianie Regulaminu Użytkownicy zostaną poinformowani
          co najmniej 7 dni przed jej wejściem w życie. Korzystanie z Serwisu po
          wejściu w życie zmian oznacza ich akceptację.
        </Text>
        <Text style={styles.paragraph}>
          §8. Postanowienia końcowe W sprawach nieuregulowanych Regulaminem
          zastosowanie mają przepisy: Kodeksu cywilnego, ustawy o świadczeniu
          usług drogą elektroniczną, ustawy o prawach konsumenta, RODO.
          Regulamin wchodzi w życie z dniem jego opublikowania na stronie
          boiskoplus.pl.
        </Text>
      </View>
    </ScrollView>
  )
}

export default Rules

const styles = StyleSheet.create({
  rulesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  rulesContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Italic',
    color: COLORS.secondary,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    lineHeight: 22,
    marginBottom: 15,
    textAlign: 'justify',
  },
})
